# Sprint 2 API Documentation

## Plaid Integration & Income Import

This document covers the API endpoints implemented in Sprint 2 for bank account connections, transaction sync, and categorization.

---

## Accounts API

### Create Link Token
Create a Plaid Link token for connecting a new bank account.

```
POST /api/v1/accounts/link-token
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "link_token": "link-sandbox-xxx",
    "expiration": "2026-01-30T12:00:00Z"
  }
}
```

### Connect Bank Account
Exchange Plaid public token for access token and create account records.

```
POST /api/v1/accounts/connect
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "public_token": "public-sandbox-xxx",
  "account_ids": ["account_id_1"],  // Optional: specific accounts
  "metadata": {
    "institution_id": "ins_xxx",
    "institution_name": "Chase"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connected 1 account(s) successfully",
  "data": {
    "accounts": [...],
    "sync_status": "initiated"
  }
}
```

### Get All Accounts
```
GET /api/v1/accounts
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_accounts": 2,
    "connected_accounts": 2,
    "error_accounts": 0,
    "accounts": [...]
  }
}
```

### Sync Account Transactions
```
POST /api/v1/accounts/:accountId/sync
Authorization: Bearer <access_token>
```

### Check Account Health
```
GET /api/v1/accounts/:accountId/health
Authorization: Bearer <access_token>
```

### Disconnect Account
```
DELETE /api/v1/accounts/:accountId
Authorization: Bearer <access_token>
```

---

## Transactions API

### List Transactions
```
GET /api/v1/transactions
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 50, max: 100) |
| account_id | uuid | Filter by account |
| transaction_type | string | income, expense, transfer, refund |
| category_id | uuid | Filter by category |
| is_business | boolean | Filter business transactions |
| review_required | boolean | Filter needing review |
| start_date | date | Start date (ISO 8601) |
| end_date | date | End date (ISO 8601) |
| min_amount | number | Minimum amount |
| max_amount | number | Maximum amount |
| search | string | Search description/merchant |

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "total_pages": 3
    },
    "summary": {
      "total_income": 5000.00,
      "total_expenses": 1200.00,
      "net": 3800.00,
      "review_count": 12
    }
  }
}
```

### Get Single Transaction
```
GET /api/v1/transactions/:transactionId
Authorization: Bearer <access_token>
```

### Update Transaction
```
PATCH /api/v1/transactions/:transactionId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "category_id": "uuid",
  "is_business": true,
  "business_percentage": 75.0,
  "notes": "Client meeting dinner"
}
```

### Mark Transaction Reviewed
```
POST /api/v1/transactions/:transactionId/review
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "category_id": "uuid",
  "is_business": true,
  "notes": "Optional notes"
}
```

### Get Transactions for Review
```
GET /api/v1/transactions/review
Authorization: Bearer <access_token>
```

### Get Transaction Statistics
```
GET /api/v1/transactions/stats
Authorization: Bearer <access_token>
```

**Query Parameters:**
- start_date (optional, default: Jan 1 current year)
- end_date (optional, default: Dec 31 current year)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-12-31"
    },
    "total_income": 45000.00,
    "total_expenses": 8500.00,
    "net_profit": 36500.00,
    "business_income": 42000.00,
    "business_expenses": 6800.00,
    "transaction_count": 450,
    "categorized_count": 420,
    "reviewed_count": 380,
    "income_by_platform": {
      "Uber": 15000.00,
      "DoorDash": 12000.00,
      "Upwork": 18000.00
    },
    "expenses_by_category": {
      "car_truck": 2500.00,
      "supplies": 800.00,
      "software": 600.00
    }
  }
}
```

### Bulk Update Transactions
```
PATCH /api/v1/transactions/bulk
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "transaction_ids": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "category_id": "uuid",
    "is_business": true,
    "reviewed_by_user": true
  }
}
```

### Get Expense Categories
```
GET /api/v1/transactions/categories
Authorization: Bearer <access_token>
```

### Exclude Transaction
```
POST /api/v1/transactions/:transactionId/exclude
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Personal expense accidentally imported"
}
```

### Include Transaction
```
POST /api/v1/transactions/:transactionId/include
Authorization: Bearer <access_token>
```

---

## Category Rules API

### List Rules
```
GET /api/v1/rules
Authorization: Bearer <access_token>
```

### Create Rule
```
POST /api/v1/rules
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "rule_type": "merchant",  // keyword, merchant, mcc, amount_range, combined
  "rule_name": "Uber Gas Stations",
  "merchant_pattern": "shell|chevron|exxon",
  "category_id": "uuid-for-car-truck",
  "is_business": true,
  "priority": 10
}
```

### Update Rule
```
PATCH /api/v1/rules/:ruleId
Authorization: Bearer <access_token>
```

### Delete Rule
```
DELETE /api/v1/rules/:ruleId
Authorization: Bearer <access_token>
```

### Get Suggested Rules
```
GET /api/v1/rules/suggestions
Authorization: Bearer <access_token>
```

### Create Rule from Suggestion
```
POST /api/v1/rules/from-suggestion
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "merchant": "SHELL OIL",
  "category_id": "uuid",
  "is_business": true
}
```

---

## Webhooks API

### Plaid Webhook
```
POST /api/v1/webhooks/plaid
```
(No authentication - called directly by Plaid)

Handles:
- TRANSACTIONS.SYNC_UPDATES_AVAILABLE
- TRANSACTIONS.INITIAL_UPDATE
- TRANSACTIONS.HISTORICAL_UPDATE
- ITEM.ERROR
- ITEM.PENDING_EXPIRATION

---

## Platform Detection

The categorization engine automatically detects income from these platforms:

**Rideshare:**
- Uber, Lyft

**Food Delivery:**
- DoorDash, Uber Eats, Grubhub, Instacart, Postmates

**Freelance:**
- Upwork, Fiverr, Freelancer

**E-commerce:**
- Etsy, eBay, Amazon Seller, Shopify

**Payments:**
- PayPal, Venmo, Cash App, Zelle, Stripe

**Other:**
- Patreon, Substack, TaskRabbit, Thumbtack, Rover, Airbnb, Turo

---

## Error Codes

| Status | Message |
|--------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 422 | Validation Error - Invalid field values |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Plaid API error |
