const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());


// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Task Manager backend is running"
  });
});


// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const { status } = req.query;

    let query = "SELECT * FROM tasks";
    let values = [];

    if (status) {
      query += " WHERE status = $1";
      values.push(status);
    }

    query += " ORDER BY id DESC";

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);

    res.status(500).json({
      error: "Failed to fetch tasks"
    });
  }
});


// Create a task
app.post("/api/tasks", async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      due_date
    } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Title is required"
      });
    }

    const query = `
      INSERT INTO tasks
      (title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      title,
      description || null,
      status || "pending",
      priority || "medium",
      due_date || null
    ];

    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Error creating task:", error);

    res.status(500).json({
      error: "Failed to create task"
    });
  }
});


// Update a task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      status,
      priority,
      due_date
    } = req.body;

    const query = `
      UPDATE tasks
      SET
        title = $1,
        description = $2,
        status = $3,
        priority = $4,
        due_date = $5
      WHERE id = $6
      RETURNING *
    `;

    const values = [
      title,
      description || null,
      status,
      priority,
      due_date || null,
      id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Error updating task:", error);

    res.status(500).json({
      error: "Failed to update task"
    });
  }
});


// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    res.status(204).send();

  } catch (error) {
    console.error("Error deleting task:", error);

    res.status(500).json({
      error: "Failed to delete task"
    });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});