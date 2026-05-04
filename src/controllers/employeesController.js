const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const SalaryTransaction = require('../models/SalaryTransaction');

function toNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

function pickEmployeePayload(body) {
  const workMode = (body?.workMode || '').toString().trim().toLowerCase();
  const safeWorkMode = ['remote', 'onsite', 'hybrid'].includes(workMode)
    ? workMode
    : undefined;

  return {
    name: typeof body?.name === 'string' ? body.name.trim() : '',
    contactNumber: typeof body?.contactNumber === 'string' ? body.contactNumber.trim() : '',
    email: typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '',
    cnic: typeof body?.cnic === 'string' ? body.cnic.trim() : '',
    joiningDate: toDate(body?.joiningDate),
    position: typeof body?.position === 'string' ? body.position.trim() : '',
    workMode: safeWorkMode,
    salary: toNumber(body?.salary, 0),
  };
}

function buildEmployeeTotalsPipeline(matchStage) {
  const pipeline = [];
  if (matchStage) pipeline.push(matchStage);

  pipeline.push(
    {
      $lookup: {
        from: 'salarytransactions',
        let: { employeeId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$employeeId', '$$employeeId'] } } },
          { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
        ],
        as: 'txAgg',
      },
    },
    {
      $addFields: {
        totalPaid: { $ifNull: [{ $arrayElemAt: ['$txAgg.totalPaid', 0] }, 0] },
      },
    },
    {
      $project: {
        __v: 0,
        txAgg: 0,
      },
    },
  );

  return pipeline;
}

async function getEmployeeWithTotals(id) {
  const employeeId = new mongoose.Types.ObjectId(id);
  const [employee] = await Employee.aggregate([
    { $match: { _id: employeeId } },
    ...buildEmployeeTotalsPipeline(),
  ]);
  return employee;
}

async function listEmployees(req, res, next) {
  try {
    const employees = await Employee.aggregate([
      { $sort: { createdAt: -1 } },
      ...buildEmployeeTotalsPipeline(),
    ]);
    return res.json({ ok: true, data: employees });
  } catch (err) {
    next(err);
  }
}

async function getEmployee(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const employee = await getEmployeeWithTotals(id);
    if (!employee) {
      return res.status(404).json({ ok: false, error: 'Employee not found' });
    }

    return res.json({ ok: true, data: employee });
  } catch (err) {
    next(err);
  }
}

async function createEmployee(req, res, next) {
  try {
    const payload = pickEmployeePayload(req.body);
    if (!payload.name) {
      return res.status(400).json({ ok: false, error: 'Employee name is required' });
    }

    if (!payload.workMode) payload.workMode = 'onsite';
    payload.salary = Math.max(0, payload.salary);

    const created = await Employee.create(payload);
    const employee = await getEmployeeWithTotals(created._id);
    return res.status(201).json({ ok: true, data: employee });
  } catch (err) {
    next(err);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const payload = pickEmployeePayload(req.body);
    if (!payload.name) {
      return res.status(400).json({ ok: false, error: 'Employee name is required' });
    }

    if (!payload.workMode) payload.workMode = 'onsite';
    payload.salary = Math.max(0, payload.salary);

    const updated = await Employee.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Employee not found' });
    }

    const employee = await getEmployeeWithTotals(id);
    return res.json({ ok: true, data: employee });
  } catch (err) {
    next(err);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid id' });
    }

    const deleted = await Employee.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Employee not found' });
    }

    await SalaryTransaction.deleteMany({ employeeId: id });

    return res.json({ ok: true, data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
