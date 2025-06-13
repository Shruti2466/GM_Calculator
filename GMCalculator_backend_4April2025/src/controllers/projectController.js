const db = require("../models")
const { calculateMetrics } = require("../utils/calculateMetrics")
const { extractEmailFromToken } = require("../utils/jwtUtils")
const moment = require("moment")
const logger = require("../logger")
const fs = require("fs")
const path = require("path")
 
exports.getAllProjects = async (req, res) => {

  const token = req.headers.authorization.split(" ")[1];
  const { role, email, role_id } = await extractEmailFromToken(token);
 
  try {

    // Fetch role and employeeTableId using email
    const employee = await db.Employee.findOne({ where: { employee_email: email } });
    
    if (!employee) return res.status(404).send("Employee not found");
    const { id: employeeTableId } = employee;
 
    let projects;
    if (role === "Admin") {
      projects = await db.Project.findAll({
        attributes: [
          "id",
          "project_code",
          "engagement_type",
          "staffingmodel",
          "service_type",
          "delivery_unit",
          "account_name",
          "project_name",
          "delivery_manager_id",
          "delivery_head_id",
          "start_date",
          "end_date",
          "createdAt",
          "updatedAt",
        ],
      });
    } else if (role === "Delivery Manager") {
      projects = await db.Project.findAll({
        where: { delivery_manager_id: employeeTableId },
        attributes: [
          "id",
          "project_code",
          "engagement_type",
          "staffingmodel",
          "service_type",
          "delivery_unit",
          "account_name",
          "project_name",
          "delivery_manager_id",
          "delivery_head_id",
          "start_date",
          "end_date",
          "createdAt",
          "updatedAt",
        ],
      });
    } else if (role === "Delivery Head") {
      projects = await db.Project.findAll({
        where: { delivery_head_id: employeeTableId },
        attributes: [
          "id",
          "project_code",
          "engagement_type",
          "staffingmodel",
          "service_type",
          "delivery_unit",
          "account_name",
          "project_name",
          "delivery_manager_id",
          "delivery_head_id",
          "start_date",
          "end_date",
          "createdAt",
          "updatedAt",
        ],
      });
    } else {
      projects = await db.Project.findAll({
        attributes: [
          "id",
          "project_code",
          "engagement_type",
          "staffingmodel",
          "service_type",
          "delivery_unit",
          "account_name",
          "project_name",
          "delivery_manager_id",
          "delivery_head_id",
          "start_date",
          "end_date",
          "createdAt",
          "updatedAt",
        ],
      });
    }
    res.json(projects);
  } catch (err) {
    logger.error(`Error in getAllProjects: ${err.message}`);
    res.status(500).send(err.message);
  }
};
 
exports.createProject = async (req, res) => {
  const {
    project_code,
    engagement_type,
    staffingmodel,
    service_type,
    delivery_unit,
    account_name,
    project_name,
    delivery_manager_id,
    delivery_head_id,
    start_date,
    end_date,
  } = req.body;
 
  try {
    const formattedStartDate = moment(start_date, "YYYY-MM-DD").format("YYYY-MM-DD");
    const formattedEndDate = moment(end_date, "YYYY-MM-DD").format("YYYY-MM-DD");
 
    const project = await db.Project.create({
      project_code,
      engagement_type,
      staffingmodel,
      service_type,
      delivery_unit,
      account_name,
      project_name,
      delivery_manager_id,
      delivery_head_id,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
    });
    res.status(201).json(project);
  } catch (err) {
    logger.error(`Error in createProject: ${err.message}`);
    res.status(500).send(err.message);
  }
};
 
exports.editProject = async (req, res) => {
  const projectId = req.params.id;
  const {
    project_code,
    engagement_type,
    staffingmodel,
    service_type,
    delivery_unit,
    account_name,
    project_name,
    delivery_manager_id,
    delivery_head_id,
    start_date,
    end_date,
  } = req.body;
 
  try {
    const formattedStartDate = moment(start_date, "YYYY-MM-DD").format("YYYY-MM-DD");
    const formattedEndDate = moment(end_date, "YYYY-MM-DD").format("YYYY-MM-DD");
 
    const project = await db.Project.update(
      {
        project_code,
        engagement_type,
        staffingmodel,
        service_type,
        delivery_unit,
        account_name,
        project_name,
        delivery_manager_id,
        delivery_head_id,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
      },
      { where: { id: projectId } },
    );
    res.status(201).json(project);
  } catch (err) {
    logger.error(`Error in editProject: ${err.message}`);
    res.status(500).send(err.message);
  }
};
 
 
// Delete Project
exports.deleteProject = async (req, res) => {
  const projectId = req.params.id
  try {
    const project = await db.Project.destroy({ where: { id: projectId } })
    if (!project) return res.status(404).json({ message: "Project not found." })
 
    res.status(200).json({ message: "Project deleted successfully." })
  } catch (err) {
    logger.error(`Error in deleteProject: ${err.message}`)
    res.status(500).send(err.message)
  }
}
 
exports.getUploadedFiles = async (req, res) => {
  try {
    const uploads = await db.Upload.findAll()
 
    const response = await Promise.all(
      uploads.map(async (upload) => {
        const project = await db.Project.findByPk(upload.project_code, {
          attributes: ["project_name"],
        })
 
        const employee = await db.User.findByPk(upload.created_by, {
          attributes: ["email"],
        })
 
        return {
          id: upload.id,
          projectName: project ? project.project_name : "Unknown Project",
          uploadedPath: upload.uploaded_path,
          createdBy: employee ? employee.email : "Unknown Employee",
          createdAt: upload.created_at,
        }
      }),
    )
 
    res.json(response)
  } catch (err) {
    logger.error(`Error in getUploadedFiles: ${err.message}`)
    res.status(500).send(err.message)
  }
}
 
exports.uploadFileAndCalculate = async (req, res) => {
  const projectId = req.params.id
 
  if (!req.files || !req.files.file1 || !req.files.file2 || !req.files.file3) {
    logger.error("All three files are required")
    return res.status(400).json({ error: "Please upload all three Excel files" })
  }
 
  const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]
  const files = [req.files.file1[0], req.files.file2[0], req.files.file3[0]]
 
  // Validate file types
  for (const file of files) {
    if (!allowedTypes.includes(file.mimetype)) {
      logger.error(`Invalid file type for ${file.originalname}`)
      return res.status(400).json({ error: `Invalid file type for ${file.originalname}` })
    }
  }
 
  try {
    const timestamp = moment().format("YYYYMMDD_HHmmss")
    const filePaths = []
 
    // Process all three files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const newFileName = `${projectId}_${timestamp}_${i + 1}_${file.originalname}`
      const newFilePath = path.join("uploads", newFileName)
 
      fs.renameSync(file.path, newFilePath)
      logger.info(`File ${i + 1} uploaded and renamed to: ${newFilePath}`)
      filePaths.push(newFilePath)
 
      // Create upload record for each file
      await db.Upload.create({
        project_code: projectId,
        uploaded_path: newFilePath,
        created_by: req.user.id,
      })
    }
    // Pass all three file paths to calculateMetrics
    const returnResponse = await calculateMetrics(filePaths[0], filePaths[1], filePaths[2], projectId)
 
    res.json({ msg: returnResponse })
  } catch (error) {
    logger.error(`Error processing files: ${error.message}`)
    res.status(500).json({ error: "Error processing files" })
  }
}
 
exports.getProjectChartData = async (req, res) => {
  const projectId = req.params.id
  try {
    const data = await db.Employee_Project_Calculations.findAll({
      where: { project_code: projectId },
      attributes: [
        [db.Sequelize.fn("CONCAT", db.Sequelize.col("month"), "/", db.Sequelize.col("year")), "name"],
        [db.Sequelize.fn("SUM", db.Sequelize.col("total_direct_cost")), "total_direct_cost"],
        [db.Sequelize.fn("SUM", db.Sequelize.col("gross_margin")), "gross_margin"],
        [db.Sequelize.fn("AVG", db.Sequelize.col("percentage_gross_margin")), "gross_margin_percentage"],
      ],
      group: ["month", "year"],
    })
 
    res.json(data)
  } catch (error) {
    logger.error(`Error fetching chart data: ${error.message}`)
    res.status(500).json({ error: "Error fetching chart data" })
  }
}