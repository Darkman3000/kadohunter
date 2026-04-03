# Approval Matrix

> Use this file to make irreversible decisions explicit before automation or implementation reaches them.

## Rules

- Every irreversible action needs a named approver.
- If the approver is missing, the action is blocked.
- Emergency actions still require retroactive logging.

## Decision Matrix

| Action | Environment | Approver | Executor | Evidence required | Notification path | Status |
|--------|-------------|----------|----------|-------------------|-------------------|--------|
| Deploy to production | `production` | `Product owner` | `AI agent` | Build success | `Chat + issue tracker` | pending |
| Merge release PR | `production` | `Product owner` | `AI agent` | Review approval | `Chat + issue tracker` | pending |
| DNS / domain change | `production` | `Product owner` | `AI agent` | Plan approval | `Chat + issue tracker` | pending |
| Billing change | `production` | `Product owner` | `AI agent` | Budget sign-off | `Chat + issue tracker` | pending |
| Store submission | `production` | `Product owner` | `AI agent` | QA sign-off | `Chat + issue tracker` | pending |
| Legal page publish | `production` | `Product owner` | `AI agent` | Text review | `Chat + issue tracker` | pending |
| Prod data migration | `production` | `Product owner` | `AI agent` | Backup proof | `Chat + issue tracker` | pending |
| Spend over `$100/mo` | `production` | `Product owner` | `AI agent` | Quote review | `Chat + issue tracker` | pending |

## Emergency Exceptions

| Scenario | Temporary executor | Retroactive approver | Max window | Notes |
|----------|--------------------|----------------------|------------|-------|
| Critical hotfix | `AI agent` | `Product owner` | `2 hours` | Only for breaking bugs |

## Notes

- `Product owner` refers to the person or role that owns irreversible business decisions.