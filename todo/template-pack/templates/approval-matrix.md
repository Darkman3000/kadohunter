# Approval Matrix

> Use this file to make irreversible decisions explicit before automation or implementation reaches them.

## Rules

- Every irreversible action needs a named approver.
- If the approver is missing, the action is blocked.
- Emergency actions still require retroactive logging.

## Decision Matrix

| Action | Environment | Approver | Executor | Evidence required | Notification path | Status |
|--------|-------------|----------|----------|-------------------|-------------------|--------|
| Deploy to production | `{{PRODUCTION_ENV_NAME}}` | `{{APPROVER_ROLE}}` | `{{EXECUTOR_ROLE}}` | Build success | `{{NOTIFICATION_PATH}}` | pending |
| Merge release PR | `{{PRODUCTION_ENV_NAME}}` | `{{APPROVER_ROLE}}` | `{{EXECUTOR_ROLE}}` | Review approval | `{{NOTIFICATION_PATH}}` | pending |
| DNS / domain change | `{{PRODUCTION_ENV_NAME}}` | `{{APPROVER_ROLE}}` | `{{EXECUTOR_ROLE}}` | Plan approval | `{{NOTIFICATION_PATH}}` | pending |
| Billing change | `{{PRODUCTION_ENV_NAME}}` | `{{APPROVER_ROLE}}` | `{{EXECUTOR_ROLE}}` | Budget sign-off | `{{NOTIFICATION_PATH}}` | pending |
| Store submission | `{{PRODUCTION_ENV_NAME}}` | `{{APPROVER_ROLE}}` | `{{EXECUTOR_ROLE}}` | QA sign-off | `{{NOTIFICATION_PATH}}` | pending |
| Legal page publish | `{{PRODUCTION_ENV_NAME}}` | `{{APPROVER_ROLE}}` | `{{EXECUTOR_ROLE}}` | Text review | `{{NOTIFICATION_PATH}}` | pending |
| Prod data migration | `{{PRODUCTION_ENV_NAME}}` | `{{APPROVER_ROLE}}` | `{{EXECUTOR_ROLE}}` | Backup proof | `{{NOTIFICATION_PATH}}` | pending |
| Spend over `{{MONTHLY_SPEND_THRESHOLD}}` | `{{PRODUCTION_ENV_NAME}}` | `{{APPROVER_ROLE}}` | `{{EXECUTOR_ROLE}}` | Quote review | `{{NOTIFICATION_PATH}}` | pending |

## Emergency Exceptions

| Scenario | Temporary executor | Retroactive approver | Max window | Notes |
|----------|--------------------|----------------------|------------|-------|
| Critical hotfix | `{{EXECUTOR_ROLE}}` | `{{APPROVER_ROLE}}` | `{{RETROACTIVE_APPROVAL_WINDOW}}` | Only for breaking bugs |

## Notes

- `{{APPROVER_ROLE}}` refers to the person or role that owns irreversible business decisions.