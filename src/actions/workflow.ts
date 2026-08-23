"use server";

import { prisma } from "../lib/prisma";

// State transitions logic
// IDEA: DRAFT -> SUBMITTED -> PITCHING -> SELECTED / REJECTED -> ASSIGNED
// SCRIPT: DRAFT -> SUBMITTED -> EDITOR_REVIEW -> REVISION_REQUIRED -> RESUBMITTED -> APPROVED
// VIDEO (PRODUCTION): PRODUCTION -> VIDEO_READY -> SUBMITTED_FOR_QA -> QA_REVIEW -> REVISION_REQUIRED -> RESUBMITTED -> APPROVED -> COMPLETED

export async function submitIdea(taskId: string, userId: string, role: string) {
  if (role !== "EDITOR" && role !== "PRODUCER") throw new Error("Unauthorized");
  
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.type !== "IDEA" || task.status !== "DRAFT") throw new Error("Invalid state");

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "SUBMITTED" }
  });

  await prisma.auditLog.create({
    data: { taskId, userId, action: "IDEA_SUBMITTED", fromStatus: "DRAFT", toStatus: "SUBMITTED" }
  });
}

export async function selectIdea(taskId: string, userId: string, role: string) {
  if (role !== "CORE" && role !== "EDITOR") throw new Error("Unauthorized");
  
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.type !== "IDEA" || (task.status !== "PITCHING" && task.status !== "SUBMITTED")) throw new Error("Invalid state");

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "SELECTED" }
  });

  await prisma.auditLog.create({
    data: { taskId, userId, action: "IDEA_SELECTED", fromStatus: task.status, toStatus: "SELECTED" }
  });
}

export async function assignProducer(taskId: string, producerId: string, userId: string, role: string) {
  if (role !== "CORE") throw new Error("Unauthorized");
  
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.type !== "IDEA" || task.status !== "SELECTED") throw new Error("Invalid state");

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "ASSIGNED", ownerId: producerId }
  });

  // Automatically create the SCRIPT task
  const scriptTask = await prisma.task.create({
    data: {
      workflowId: task.workflowId,
      type: "SCRIPT",
      status: "DRAFT",
      ownerId: producerId,
      title: "Script for Idea " + task.id
    }
  });

  await prisma.auditLog.create({
    data: { taskId, userId, action: "PRODUCER_ASSIGNED", fromStatus: "SELECTED", toStatus: "ASSIGNED", comment: `Assigned to ${producerId}` }
  });
}

export async function submitScript(taskId: string, userId: string, role: string) {
  if (role !== "PRODUCER") throw new Error("Unauthorized");
  
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.type !== "SCRIPT" || (task.status !== "DRAFT" && task.status !== "REVISION_REQUIRED")) throw new Error("Invalid state");

  await prisma.task.update({
    where: { id: taskId },
    data: { status: task.status === "DRAFT" ? "SUBMITTED" : "RESUBMITTED" }
  });

  await prisma.auditLog.create({
    data: { taskId, userId, action: "SCRIPT_SUBMITTED", fromStatus: task.status, toStatus: task.status === "DRAFT" ? "SUBMITTED" : "RESUBMITTED" }
  });
}

export async function reviewScript(taskId: string, action: "APPROVE" | "REVISE", userId: string, role: string, comment?: string) {
  if (role !== "EDITOR" && role !== "CORE") throw new Error("Unauthorized");
  
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.type !== "SCRIPT") throw new Error("Invalid state");

  const toStatus = action === "APPROVE" ? "APPROVED" : "REVISION_REQUIRED";

  await prisma.task.update({
    where: { id: taskId },
    data: { status: toStatus }
  });

  await prisma.auditLog.create({
    data: { taskId, userId, action: `SCRIPT_${action}`, fromStatus: task.status, toStatus, comment }
  });

  if (action === "APPROVE") {
    // Automatically create Production task
    await prisma.task.create({
      data: {
        workflowId: task.workflowId,
        type: "VIDEO",
        status: "PRODUCTION",
        ownerId: task.ownerId,
        title: "Production for Idea " + task.id
      }
    });
  }
}

export async function submitVideo(taskId: string, userId: string, role: string) {
  if (role !== "PRODUCER") throw new Error("Unauthorized");
  
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.type !== "VIDEO" || (task.status !== "PRODUCTION" && task.status !== "REVISION_REQUIRED")) throw new Error("Invalid state");

  await prisma.task.update({
    where: { id: taskId },
    data: { status: task.status === "PRODUCTION" ? "SUBMITTED_FOR_QA" : "RESUBMITTED" }
  });

  await prisma.auditLog.create({
    data: { taskId, userId, action: "VIDEO_SUBMITTED", fromStatus: task.status, toStatus: task.status === "PRODUCTION" ? "SUBMITTED_FOR_QA" : "RESUBMITTED" }
  });
}

export async function qualityCheck(taskId: string, action: "PASS" | "REVISE", userId: string, role: string, comment?: string) {
  if (role !== "EDITOR") throw new Error("Unauthorized");
  
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.type !== "VIDEO" || (task.status !== "SUBMITTED_FOR_QA" && task.status !== "RESUBMITTED")) throw new Error("Invalid state");

  const toStatus = action === "PASS" ? "COMPLETED" : "REVISION_REQUIRED";

  await prisma.task.update({
    where: { id: taskId },
    data: { status: toStatus }
  });

  await prisma.auditLog.create({
    data: { taskId, userId, action: `QA_${action}`, fromStatus: task.status, toStatus, comment }
  });
}
