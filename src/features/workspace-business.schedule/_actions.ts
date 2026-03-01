/**
 * @fileoverview schedule.commands.ts - Pure business logic for schedule item interactions.
 * @description Contains framework-agnostic action functions for managing member
 * assignments on schedule items. These functions can be called from React hooks,
 * context, or future Server Actions without any React dependencies.
 *
 * Per logic-overview.md [R4] COMMAND_RESULT_CONTRACT:
 *   All mutations return CommandResult discriminated union.
 */

import {
  assignMemberToScheduleItem,
  unassignMemberFromScheduleItem,
  createScheduleItem as createScheduleItemFacade,
  updateScheduleItemStatus as updateScheduleItemStatusFacade,
  assignMemberAndApprove as assignMemberAndApproveFacade,
} from "@/shared/infra/firestore/firestore.facade";
import type { ScheduleItem } from "@/shared/types";
import {
  type CommandResult,
  commandSuccess,
  commandFailureFrom,
} from "@/features/shared.kernel.contract-interfaces";

/**
 * Assigns a member to a schedule item.
 * @param accountId The ID of the organization account that owns the schedule item.
 * @param itemId The ID of the schedule item.
 * @param memberId The ID of the member to assign.
 */
export async function assignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await assignMemberToScheduleItem(accountId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "ASSIGN_MEMBER_TO_SCHEDULE_FAILED",
      err instanceof Error ? err.message : "Failed to assign member to schedule item"
    );
  }
}

/**
 * Unassigns a member from a schedule item.
 * @param accountId The ID of the organization account that owns the schedule item.
 * @param itemId The ID of the schedule item.
 * @param memberId The ID of the member to unassign.
 */
export async function unassignMember(
  accountId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await unassignMemberFromScheduleItem(accountId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "UNASSIGN_MEMBER_FROM_SCHEDULE_FAILED",
      err instanceof Error ? err.message : "Failed to unassign member from schedule item"
    );
  }
}

/**
 * Creates a new schedule item in the account's schedule sub-collection.
 * @param itemData The data for the new schedule item (without id, createdAt, updatedAt).
 */
export async function createScheduleItem(
  itemData: Omit<ScheduleItem, "id" | "createdAt" | "updatedAt">
): Promise<CommandResult> {
  try {
    const id = await createScheduleItemFacade(itemData);
    return commandSuccess(id, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "CREATE_SCHEDULE_ITEM_FAILED",
      err instanceof Error ? err.message : "Failed to create schedule item"
    );
  }
}

/**
 * Updates the approval status of a schedule item.
 * @param organizationId The ID of the organization that owns the schedule item.
 * @param itemId The ID of the schedule item.
 * @param newStatus The new status to set.
 */
export async function updateScheduleItemStatus(
  organizationId: string,
  itemId: string,
  newStatus: "OFFICIAL" | "REJECTED" | "COMPLETED"
): Promise<CommandResult> {
  try {
    await updateScheduleItemStatusFacade(organizationId, itemId, newStatus);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "UPDATE_SCHEDULE_ITEM_STATUS_FAILED",
      err instanceof Error ? err.message : "Failed to update schedule item status"
    );
  }
}

/**
 * Assigns a member to a schedule item and marks it OFFICIAL in one write.
 * Single source of truth: accounts/{orgId}/schedule_items — keeps Calendar,
 * DemandBoard, and HR Governance all consistent via the same document.
 *
 * @param organizationId The owning org account ID.
 * @param itemId The schedule item ID.
 * @param memberId The member to assign.
 */
export async function approveScheduleItemWithMember(
  organizationId: string,
  itemId: string,
  memberId: string
): Promise<CommandResult> {
  try {
    await assignMemberAndApproveFacade(organizationId, itemId, memberId);
    return commandSuccess(itemId, Date.now());
  } catch (err) {
    return commandFailureFrom(
      "APPROVE_SCHEDULE_ITEM_FAILED",
      err instanceof Error ? err.message : "Failed to approve schedule item"
    );
  }
}


