---
aliases:
  - ../../../http_api/dashboard/ # /docs/grafana/next/http_api/dashboard/
  - ../../../developers/http_api/dashboard/ # /docs/grafana/next/developers/http_api/dashboard/
canonical: https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/dashboard/
description: Grafana Dashboard HTTP API
keywords:
  - grafana
  - http
  - documentation
  - api
  - dashboard
labels:
  products:
    - enterprise
    - oss
    - cloud
title: Dashboard HTTP API
---

# New Dashboard APIs

> If you are running Grafana Enterprise, for some endpoints you'll need to have specific permissions. Refer to [Role-based access control permissions](/docs/grafana/latest/administration/roles-and-permissions/access-control/custom-role-actions-scopes/) for more information.

> To view more about the new API structure, refer to [API overview](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developers/http_api/apis/).

## Create Dashboard

`POST /apis/dashboard.grafana.app/v1beta1/namespaces/:namespace/dashboards`

Creates a new dashboard.

- namespace: to read more about the namespace to use, see the [API overview](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developers/http_api/apis/).

**Required permissions**

See note in the [introduction]({{< ref "#dashboard-api" >}}) for an explanation.

<!-- prettier-ignore-start -->
| Action              | Scope                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:create` | <ul><li>`folders:*`</li><li>`folders:uid:*`</li></ul>                                                   |
| `dashboards:write`  | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Create Request**:

```http
POST /apis/dashboard.grafana.app/v1beta1/namespaces/default/dashboards HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "metadata": {
    "name": "gdxccn",
    "annotations": {
      "grafana.app/folder": "fef30w4jaxla8b"
    },
  },
  "spec": {
    "annotations": {
    "list": [
      {
        "datasource": {
          "type": "datasource",
          "uid": "grafana"
        },
        "enable": true,
        "hide": false,
        "iconColor": "red",
        "name": "Example annotation",
        "target": {
          "limit": 100,
          "matchAny": false,
          "tags": [],
          "type": "dashboard"
        }
      }]
    },
    "editable": true,
    "fiscalYearStartMonth": 0,
    "graphTooltip": 0,
    "links": [
      {
        "asDropdown": false,
        "icon": "external link",
        "includeVars": false,
        "keepTime": false,
        "tags": [],
        "targetBlank": false,
        "title": "Example Link",
        "tooltip": "",
        "type": "dashboards",
        "url": ""
      }
    ],
    "panels": [
      {
        "datasource": {
          "type": "datasource",
          "uid": "grafana"
        },
        "description": "With a description",
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisBorderShow": false,
              "axisCenteredZero": false,
              "axisColorMode": "text",
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "barWidthFactor": 0.6,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "viz": false
              },
              "insertNulls": false,
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green"
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            }
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        },
        "id": 1,
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": true
          },
          "tooltip": {
            "hideZeros": false,
            "mode": "single",
            "sort": "none"
          }
        },
        "pluginVersion": "12.0.0",
        "targets": [
          {
            "datasource": {
              "type": "datasource",
              "uid": "grafana"
            },
            "refId": "A"
          }
        ],
        "title": "Example panel",
        "type": "timeseries"
      }
    ],
    "preload": false,
    "schemaVersion": 41,
    "tags": ["example"],
    "templating": {
      "list": [
        {
          "current": {
            "text": "",
            "value": ""
          },
          "definition": "",
          "description": "example description",
          "label": "ExampleLabel",
          "name": "ExampleVariable",
          "options": [],
          "query": "",
          "refresh": 1,
          "regex": "cluster",
          "type": "query"
        }
      ]
    },
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "timepicker": {},
    "timezone": "browser",
    "title": "Example Dashboard",
    "version": 0
  }
}
```

JSON Body schema:

- **metadata.name** – The Grafana [unique identifier]({{< ref "#identifier-id-vs-unique-identifier-uid" >}}). If you do not want to provide this, set metadata.generateName instead to the prefix you would like for the randomly generated uid (cannot be an empty string).
- **metadata.annotations.grafana.app/folder** - Optional field, the unique identifier of the folder under which the dashboard should be created.
- **spec** – The dashboard json.

{{< admonition type="note" >}}
Custom labels and annotations in the metadata field are supported on some instances, with full support planned for all instances when these APIs reach general availability. If they are not yet supported on your instance, they will be ignored.
{{< /admonition >}}

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Content-Length: 485

{
  "kind": "Dashboard",
  "apiVersion": "dashboard.grafana.app/v1beta1",
  "metadata": {
    "name": "gdxccn",
    "namespace": "default",
    "uid": "Cc7fA5ffHY94NnHZyMxXvFlpFtOmkK3qkBcVZPKSPXcX",
    "resourceVersion": "1",
    "generation": 1,
    "creationTimestamp": "2025-04-24T20:35:29Z",
    "labels": {
      "grafana.app/deprecatedInternalID": "11"
    },
    "annotations": {
      "grafana.app/createdBy": "service-account:dejwtrofg77y8d",
      "grafana.app/folder": "fef30w4jaxla8b"
    },
    "managedFields": [
      {
        "manager": "curl",
        "operation": "Update",
        "apiVersion": "dashboard.grafana.app/v0alpha1",
        "time": "2025-04-24T20:35:29Z",
        "fieldsType": "FieldsV1",
        "fieldsV1": {
          "f:spec": {
            "f:annotations": {
              ".": {},
              "f:list": {}
            },
            "f:editable": {},
            "f:fiscalYearStartMonth": {},
            "f:graphTooltip": {},
            "f:links": {},
            "f:panels": {},
            "f:preload": {},
            "f:schemaVersion": {},
            "f:tags": {},
            "f:templating": {
              ".": {},
              "f:list": {}
            },
            "f:time": {
              ".": {},
              "f:from": {},
              "f:to": {}
            },
            "f:timepicker": {},
            "f:timezone": {},
            "f:title": {},
            "f:version": {}
          }
        }
      }
    ]
  },
  "spec": {
    "annotations": {
      "list": [
        {
          "datasource": {
            "type": "datasource",
            "uid": "grafana"
          },
          "enable": true,
          "hide": false,
          "iconColor": "red",
          "name": "Example annotation",
          "target": {
            "limit": 100,
            "matchAny": false,
            "tags": [],
            "type": "dashboard"
          }
        }
      ]
    },
    "editable": true,
    "fiscalYearStartMonth": 0,
    "graphTooltip": 0,
    "links": [
      {
        "asDropdown": false,
        "icon": "external link",
        "includeVars": false,
        "keepTime": false,
        "tags": [],
        "targetBlank": false,
        "title": "Example Link",
        "tooltip": "",
        "type": "dashboards",
        "url": ""
      }
    ],
    "panels": [
      {
        "datasource": {
          "type": "datasource",
          "uid": "grafana"
        },
        "description": "With a description",
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "palette-classic"
            },
            "custom": {
              "axisBorderShow": false,
              "axisCenteredZero": false,
              "axisColorMode": "text",
              "axisLabel": "",
              "axisPlacement": "auto",
              "barAlignment": 0,
              "barWidthFactor": 0.6,
              "drawStyle": "line",
              "fillOpacity": 0,
              "gradientMode": "none",
              "hideFrom": {
                "legend": false,
                "tooltip": false,
                "viz": false
              },
              "insertNulls": false,
              "lineInterpolation": "linear",
              "lineWidth": 1,
              "pointSize": 5,
              "scaleDistribution": {
                "type": "linear"
              },
              "showPoints": "auto",
              "spanNulls": false,
              "stacking": {
                "group": "A",
                "mode": "none"
              },
              "thresholdsStyle": {
                "mode": "off"
              }
            },
            "mappings": [],
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {
                  "color": "green"
                },
                {
                  "color": "red",
                  "value": 80
                }
              ]
            }
          },
          "overrides": []
        },
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        },
        "id": 1,
        "options": {
          "legend": {
            "calcs": [],
            "displayMode": "list",
            "placement": "bottom",
            "showLegend": true
          },
          "tooltip": {
            "hideZeros": false,
            "mode": "single",
            "sort": "none"
          }
        },
        "pluginVersion": "12.0.0",
        "targets": [
          {
            "datasource": {
              "type": "datasource",
              "uid": "grafana"
            },
            "refId": "A"
          }
        ],
        "title": "Example panel",
        "type": "timeseries"
      }
    ],
    "preload": false,
    "schemaVersion": 41,
    "tags": [
      "example"
    ],
    "templating": {
      "list": [
        {
          "current": {
            "text": "",
            "value": ""
          },
          "definition": "",
          "description": "example description",
          "label": "ExampleLabel",
          "name": "ExampleVariable",
          "options": [],
          "query": "",
          "refresh": 1,
          "regex": "cluster",
          "type": "query"
        }
      ]
    },
    "time": {
      "from": "now-6h",
      "to": "now"
    },
    "timepicker": {},
    "timezone": "browser",
    "title": "Example Dashboard"
  },
  "status": {}
```

Status Codes:

- **201** – Created
- **400** – Errors (invalid json, missing or invalid fields, etc)
- **401** – Unauthorized
- **403** – Access denied
- **409** – Conflict (dashboard with the same uid already exists)

## Update Dashboard

`PUT /apis/dashboard.grafana.app/v1beta1/namespaces/:namespace/dashboards/:uid`

Updates an existing dashboard via the dashboard uid.

- namespace: to read more about the namespace to use, see the [API overview](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developers/http_api/apis/).
- uid: the unique identifier of the dashboard to update. this will be the _name_ in the dashboard response

**Required permissions**

See note in the [introduction]({{< ref "#dashboard-api" >}}) for an explanation.

<!-- prettier-ignore-start -->
| Action              | Scope                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:write`  | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Update Request**:

```http
POST /apis/dashboard.grafana.app/v1beta1/namespaces/default/dashboards/gdxccn HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "metadata": {
    "name": "gdxccn",
    "annotations": {
      "grafana.app/folder": "fef30w4jaxla8b",
      "grafana.app/message": "commit message"
    },
  },
  "spec": {
    "title": "New dashboard - updated",
    "schemaVersion": 41,
    ...
  }
}
```

JSON Body schema:

- **metadata.name** – The [unique identifier]({{< ref "#identifier-id-vs-unique-identifier-uid" >}}).
- **metadata.annotations.grafana.app/folder** - Optional field, the unique identifier of the folder under which the dashboard should be created.
- **metadata.annotations.grafana.app/message** - Optional field, to set a commit message for the version history.
- **spec** – The dashboard json.

{{< admonition type="note" >}}
Custom labels and annotations in the metadata field are supported on some instances, with full support planned for all instances when these APIs reach general availability. If they are not yet supported on your instance, they will be ignored.
{{< /admonition >}}

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Content-Length: 485

{
  "kind": "Dashboard",
  "apiVersion": "dashboard.grafana.app/v1beta1",
  "metadata": {
    "name": "gdxccn",
    "namespace": "default",
    "uid": "Cc7fA5ffHY94NnHZyMxXvFlpFtOmkK3qkBcVZPKSPXcX",
    "resourceVersion": "2",
    "generation": 2,
    "creationTimestamp": "2025-03-06T19:57:18Z",
    "annotations": {
      "grafana.app/folder": "fef30w4jaxla8b",
      "grafana.app/createdBy": "service-account:cef2t2rfm73lsb",
      "grafana.app/updatedBy": "service-account:cef2t2rfm73lsb",
      "grafana.app/updatedTimestamp": "2025-03-07T02:58:36Z"
    }
  },
  "spec": {
    "schemaVersion": 41,
    "title": "New dashboard - updated",
    ...
  }
}
```

Status Codes:

- **200** – OK
- **400** – Errors (invalid json, missing or invalid fields, etc)
- **401** – Unauthorized
- **403** – Access denied
- **409** – Conflict (dashboard with the same version already exists)

## Get Dashboard

`GET /apis/dashboard.grafana.app/v1beta1/namespaces/:namespace/dashboards/:uid`

Gets a dashboard via the dashboard uid.

- namespace: to read more about the namespace to use, see the [API overview](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developers/http_api/apis/).
- uid: the unique identifier of the dashboard to update. this will be the _name_ in the dashboard response

**Required permissions**

See note in the [introduction]({{< ref "#dashboard-api" >}}) for an explanation.

<!-- prettier-ignore-start -->
| Action            | Scope                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:read` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Get Request**:

```http
GET /apis/dashboard.grafana.app/v1beta1/namespaces/default/dashboards/gdxccn HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Content-Length: 485

{
  "kind": "Dashboard",
  "apiVersion": "dashboard.grafana.app/v1beta1",
  "metadata": {
    "name": "gdxccn",
    "namespace": "default",
    "uid": "Cc7fA5ffHY94NnHZyMxXvFlpFtOmkK3qkBcVZPKSPXcX",
    "resourceVersion": "2",
    "generation": 2,
    "creationTimestamp": "2025-03-06T19:57:18Z",
    "annotations": {
      "grafana.app/createdBy": "service-account:cef2t2rfm73lsb",
      "grafana.app/updatedBy": "service-account:cef2t2rfm73lsb",
      "grafana.app/updatedTimestamp": "2025-03-07T02:58:36Z"
    }
  },
  "spec": {
    "schemaVersion": 41,
    "title": "New dashboard - updated",
    ...
  }
}
```

Status Codes:

- **200** – OK
- **401** – Unauthorized
- **403** – Access denied
- **404** – Not Found

### Retrieve additional access information

`GET /apis/dashboard.grafana.app/v1beta1/namespaces/:namespace/dashboards/:uid/dto`

Retrieves a dashboard with additional access information.

The `GET` response includes an additional `access` section with data such as if it's a public dashboard, or the dashboard permissions (admin, editor) of the user who made the request.

## List Dashboards

`GET /apis/dashboard.grafana.app/v1beta1/namespaces/:namespace/dashboards`

Lists all dashboards in the given organization. You can control the maximum number of dashboards returned through the `limit` query parameter. You can then use the `continue` token returned to fetch the next page of dashboards.

- namespace: to read more about the namespace to use, see the [API overview](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developers/http_api/apis/).

**Query parameters**:

- **`limit`** (optional): Maximum number of dashboards to return
- **`continue`** (optional): Continue token from a previous response to fetch the next page

**Required permissions**

See note in the [introduction]({{< ref "#dashboard-api" >}}) for an explanation.

<!-- prettier-ignore-start -->
| Action            | Scope                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:read` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Get Request**:

```http
GET /apis/dashboard.grafana.app/v1beta1/namespaces/default/dashboards?limit=1 HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Content-Length: 644

{
  "kind": "DashboardList",
  "apiVersion": "dashboard.grafana.app/v1alpha1",
  "metadata": {
    "resourceVersion": "1741315830000",
    "continue": "eyJvIjoxNTIsInYiOjE3NjE3MDQyMjQyMDcxODksInMiOmZhbHNlfQ=="
  },
  "items": [
    {
      "kind": "Dashboard",
      "apiVersion": "dashboard.grafana.app/v1alpha1",
      "metadata": {
        "name": "gpqcmf",
        "namespace": "default",
        "uid": "VQyL7pNTpfGPNlPM6HRJSePrBg5dXmxr4iPQL7txLtwX",
        "resourceVersion": "1",
        "generation": 1,
        "creationTimestamp": "2025-03-06T19:50:30Z",
        "annotations": {
          "grafana.app/createdBy": "service-account:cef2t2rfm73lsb",
          "grafana.app/updatedBy": "service-account:cef2t2rfm73lsb",
          "grafana.app/updatedTimestamp": "2025-03-06T19:50:30Z"
        }
      },
      "spec": {
        "schemaVersion": 41,
        "title": "New dashboard",
        "uid": "gpqcmf",
        "version": 1,
        ...
      }
    }
  ]
}
```

The `metadata.continue` field contains a token to fetch the next page.

**Example subsequent request using continue token**:

```http
GET /apis/dashboard.grafana.app/v1beta1/namespaces/default/dashboards?limit=1&continue=eyJvIjoxNTIsInYiOjE3NjE3MDQyMjQyMDcxODksInMiOmZhbHNlfQ== HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example subsequent response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8

{
  "kind": "DashboardList",
  "apiVersion": "dashboard.grafana.app/v1alpha1",
  "items": [
    {
      "kind": "Dashboard",
      "apiVersion": "dashboard.grafana.app/v1alpha1",
      "metadata": {
        "name": "hpqcmg",
        "namespace": "default",
        "uid": "WQyL7pNTpfGPNlPM6HRJSePrBg5dXmxr4iPQL7txLtwY",
        "resourceVersion": "1",
        "generation": 1,
        "creationTimestamp": "2025-03-06T19:51:31Z",
        "annotations": {
          "grafana.app/createdBy": "service-account:cef2t2rfm73lsb",
          "grafana.app/updatedBy": "service-account:cef2t2rfm73lsb",
          "grafana.app/updatedTimestamp": "2025-03-06T19:51:31Z"
        }
      },
      "spec": {
        "schemaVersion": 41,
        "title": "Another dashboard",
        "uid": "hpqcmg",
        "version": 1,
        ...
      }
    }
  ]
}
```

Continue making requests with the updated `continue` token until you receive a response without a `continue` field in the metadata, indicating you've reached the last page.

Status Codes:

- **200** – OK
- **401** – Unauthorized
- **403** – Access denied

## Delete Dashboard

`DELETE /apis/dashboard.grafana.app/v1beta1/namespaces/:namespace/dashboards/:uid`

Deletes a dashboard via the dashboard uid.

- **`namespace`**: To read more about the namespace to use, see the [API overview](https://grafana.com/docs/grafana/<GRAFANA_VERSION>/developers/http_api/apis/).
- **`uid`**: The unique identifier of the dashboard to update. This is the `metadata.name` field in the dashboard response and _not_ the `metadata.uid` field.

**Required permissions**

See note in the [introduction](#new-dashboard-apis) for an explanation.

<!-- prettier-ignore-start -->
| Action              | Scope                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:delete` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Delete Request**:

```http
DELETE /apis/dashboard.grafana.app/v1beta1/namespaces/default/dashboards/gdxccn HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Content-Length: 78

{
  "kind": "Status",
  "apiVersion": "v1",
  "metadata": {},
  "status": "Success",
  "details": {
    "name": "gdxccn",
    "group": "dashboard.grafana.app",
    "kind": "dashboards",
    "uid": "Cc7fA5ffHY94NnHZyMxXvFlpFtOmkK3qkBcVZPKSPXcX"
  }
}
```

Status Codes:

- **200** – OK
- **401** – Unauthorized
- **403** – Access denied
- **404** – Not found

## Gets the home dashboard

`GET /api/dashboards/home`

Will return the home dashboard.

**Example Request**:

```http
GET /api/dashboards/home HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200
Content-Type: application/json

{
  "dashboard": {
    "editable":false,
    "nav":[
      {
        "enable":false,
        "type":"timepicker"
      }
    ],
    "style":"dark",
    "tags":[],
    "templating":{
      "list":[
      ]
    },
    "time":{
    },
    "timezone":"browser",
    "title":"Home",
    "version":5
  },
  "meta":	{
    "isHome":true,
    "canSave":false,
    "canEdit":false,
    "canStar":false,
    "url":"",
    "expires":"0001-01-01T00:00:00Z",
    "created":"0001-01-01T00:00:00Z"
  }
}
```

## Tags for Dashboard

`GET /api/dashboards/tags`

Get all tags of dashboards

**Example Request**:

```http
GET /api/dashboards/tags HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200
Content-Type: application/json

[
  {
    "term":"tag1",
    "count":1
  },
  {
    "term":"tag2",
    "count":4
  }
]
```

## Dashboard Search

See [Folder/Dashboard Search API](../folder_dashboard_search/).

## APIs

### Unique identifier (uid) vs identifier (id)

The unique identifier (uid) of a dashboard can be used to uniquely identify a dashboard within a given org.
It's automatically generated if not provided when creating a dashboard. The uid allows having consistent URLs for accessing
dashboards and when syncing dashboards between multiple Grafana installs, see [dashboard provisioning](/docs/grafana/latest/administration/provisioning/#dashboards)
for more information. This means that changing the title of a dashboard will not break any bookmarked links to that dashboard.

The uid can have a maximum length of 40 characters.

The identifier (id) of a dashboard is deprecated in favor of the unique identifier (uid).

### Create / Update dashboard

`POST /api/dashboards/db`

Creates a new dashboard or updates an existing dashboard. When updating existing dashboards, if you do not define the `folderId` or the `folderUid` property, then the dashboard(s) are moved to the root level. (You need to define only one property, not both).

> **Note:** This endpoint is not intended for creating folders, use `POST /api/folders` for that.

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action              | Scope                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:create` | <ul><li>`folders:*`</li><li>`folders:uid:*`</li></ul>                                                   |
| `dashboards:write`  | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request for new dashboard**:

```http
POST /api/dashboards/db HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "dashboard": {
    "id": null,
    "uid": null,
    "title": "Production Overview",
    "tags": [ "templated" ],
    "timezone": "browser",
    "schemaVersion": 16,
    "refresh": "25s"
  },
  "folderUid": "l3KqBxCMz",
  "message": "Made changes to xyz",
  "overwrite": false
}
```

JSON Body schema:

- **dashboard** – The complete dashboard model.
- **dashboard.id** – id = null to create a new dashboard.
- **dashboard.uid** – Optional unique identifier when creating a dashboard. uid = null will generate a new uid.
- **dashboard.refresh** - Set the dashboard refresh interval. If this is lower than [the minimum refresh interval](/docs/grafana/latest/setup-grafana/configure-grafana/#min_refresh_interval), then Grafana will ignore it and will enforce the minimum refresh interval.
- **folderId** – The id of the folder to save the dashboard in.
- **folderUid** – The UID of the folder to save the dashboard in. Overrides the `folderId`.
- **overwrite** – Set to true if you want to overwrite an existing dashboard with a given dashboard UID.
- **message** - Set a commit message for the version history.

**Example Request for updating a dashboard**:

```http
POST /api/dashboards/db HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "dashboard": {
    "id": 1,
    "title": "Production Overview Updated",
    "tags": [ "templated" ],
    "timezone": "browser",
    "schemaVersion": 16,
    "version": 1,
    "refresh": "25s"
  },
  "folderUid": "l3KqBxCMz",
  "message": "Made changes to xyz",
  "overwrite": false
}
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=UTF-8
Content-Length: 78

{
    "id": 1,
    "uid": "e883f11b-77c0-4ee3-9a70-3ba223d66e56",
    "url": "/d/e883f11b-77c0-4ee3-9a70-3ba223d66e56/production-overview-updated",
    "status": "success",
    "version": 2
    "slug": "production-overview-updated",
}
```

Status Codes:

- **200** – Created
- **400** – Errors (invalid json, missing or invalid fields, etc)
- **401** – Unauthorized
- **403** – Access denied
- **412** – Precondition failed

The **412** status code is used for explaining that you cannot create the dashboard and why.
There can be different reasons for this:

- The dashboard has been changed by someone else, `status=version-mismatch`
- A dashboard with the same uid already exists, `status=name-exists`
- The dashboard belongs to plugin `<plugin title>`, `status=plugin-dashboard`

The response body will have the following properties:

```http
HTTP/1.1 412 Precondition Failed
Content-Type: application/json; charset=UTF-8
Content-Length: 97

{
  "message": "The dashboard has been changed by someone else",
  "status": "version-mismatch"
}
```

### Get dashboard by uid

`GET /api/dashboards/uid/:uid`

Will return the dashboard given the dashboard unique identifier (uid). Information about the unique identifier of a folder containing the requested dashboard might be found in the metadata.

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action            | Scope                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:read` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
GET /api/dashboards/uid/cIBgcSjkk HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200
Content-Type: application/json

{
  "dashboard": {
    "id": 1,
    "uid": "cIBgcSjkk",
    "title": "Production Overview",
    "tags": [ "templated" ],
    "timezone": "browser",
    "schemaVersion": 16,
    "version": 0
  },
  "meta": {
    "isStarred": false,
    "url": "/d/cIBgcSjkk/production-overview",
    "folderId": 2,
    "folderUid": "l3KqBxCMz",
    "slug": "production-overview" //deprecated in Grafana v5.0
  }
}
```

Status Codes:

- **200** – Found
- **401** – Unauthorized
- **403** – Access denied
- **404** – Not found

### Delete dashboard by uid

`DELETE /api/dashboards/uid/:uid`

Will delete the dashboard given the specified unique identifier (uid).

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action              | Scope                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:delete` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
DELETE /api/dashboards/uid/cIBgcSjkk HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200
Content-Type: application/json

{
  "title": "Production Overview",
  "message": "Dashboard Production Overview deleted",
  "id": 2
}
```

Status Codes:

- **200** – Deleted
- **401** – Unauthorized
- **403** – Access denied
- **404** – Not found

## Get Dashboard Permissions

`GET /api/dashboards/uid/:uid/permissions`

Gets all existing permissions for a dashboard.

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action                        | Scope                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards.permissions:read` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
GET /api/dashboards/uid/cIBgcSjkk/permissions HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "dashboardId": 1,
    "created": "2017-06-20T02:00:00Z",
    "updated": "2017-06-20T02:00:00Z",
    "userId": 1,
    "userLogin": "admin",
    "userEmail": "admin@localhost",
    "teamId": 0,
    "team": "",
    "role": "",
    "permission": 4,
    "permissionName": "Admin",
    "uid": "cIBgcSjkk",
    "title": "My Dashboard",
    "slug": "my-dashboard",
    "isFolder": false,
    "url": "/d/cIBgcSjkk/my-dashboard"
  },
  {
    "id": 2,
    "dashboardId": 1,
    "created": "2017-06-20T02:00:00Z",
    "updated": "2017-06-20T02:00:00Z",
    "userId": 0,
    "userLogin": "",
    "userEmail": "",
    "teamId": 1,
    "team": "MyTeam",
    "role": "",
    "permission": 1,
    "permissionName": "View",
    "uid": "cIBgcSjkk",
    "title": "My Dashboard",
    "slug": "my-dashboard",
    "isFolder": false,
    "url": "/d/cIBgcSjkk/my-dashboard"
  }
]
```

Status Codes:

- **200** – OK
- **401** – Unauthorized
- **403** – Access denied
- **404** – Dashboard not found

## Update Dashboard Permissions

`POST /api/dashboards/uid/:uid/permissions`

Updates permissions for a dashboard. This operation removes existing permissions if they're not included in the request.

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action                         | Scope                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `dashboards.permissions:write` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
POST /api/dashboards/uid/cIBgcSjkk/permissions HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "items": [
    {
      "userId": 1,
      "permission": 4
    },
    {
      "teamId": 1,
      "permission": 1
    },
    {
      "role": "Editor",
      "permission": 2
    }
  ]
}
```

JSON Body schema:

- **items** – Array of permission items to set.
- **items.userId** – ID of the user to set permission for (use either userId, teamId, or role).
- **items.teamId** – ID of the team to set permission for (use either userId, teamId, or role).
- **items.role** – Role to set permission for. Can be `Viewer`, `Editor`, or `Admin` (use either userId, teamId, or role).
- **items.permission** – Permission level: 1 = View, 2 = Edit, 4 = Admin.

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Dashboard permissions updated"
}
```

Status Codes:

- **200** – OK
- **400** – Bad request (invalid permission configuration)
- **401** – Unauthorized
- **403** – Access denied
- **404** – Dashboard not found

## Get Dashboard Versions

`GET /api/dashboards/uid/:uid/versions`

Gets all existing versions for a dashboard using UID.

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action             | Scope                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `dashboards:write` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Query parameters**:

- **`limit`** (optional): Maximum number of versions to return.
- **`start`** (optional): Version number to start from when returning versions.
- **`continueToken`** (optional): Token for pagination to fetch next batch.

**Example Request**:

```http
GET /api/dashboards/uid/cIBgcSjkk/versions?limit=10 HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "versions": [
    {
      "id": 2,
      "dashboardId": 1,
      "dashboardUid": "cIBgcSjkk",
      "parentVersion": 1,
      "restoredFrom": 0,
      "version": 2,
      "created": "2017-06-08T17:24:33Z",
      "createdBy": "admin",
      "message": "Updated panel title"
    },
    {
      "id": 1,
      "dashboardId": 1,
      "dashboardUid": "cIBgcSjkk",
      "parentVersion": 0,
      "restoredFrom": 0,
      "version": 1,
      "created": "2017-06-08T17:23:33Z",
      "createdBy": "admin",
      "message": "Initial save"
    }
  ],
  "continueToken": ""
}
```

Status Codes:

- **200** – OK
- **401** – Unauthorized
- **403** – Access denied
- **404** – Dashboard not found

## Get Dashboard Version

`GET /api/dashboards/uid/:uid/versions/:id`

Gets a specific dashboard version using UID.

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action             | Scope                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `dashboards:write` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
GET /api/dashboards/uid/cIBgcSjkk/versions/1 HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "dashboardId": 1,
  "dashboardUid": "cIBgcSjkk",
  "parentVersion": 0,
  "restoredFrom": 0,
  "version": 1,
  "created": "2017-06-08T17:23:33Z",
  "createdBy": "admin",
  "message": "Initial save",
  "data": {
    "title": "My Dashboard",
    "panels": [],
    "schemaVersion": 16,
    "version": 1
  }
}
```

Status Codes:

- **200** – OK
- **401** – Unauthorized
- **403** – Access denied
- **404** – Dashboard or version not found

## Restore Dashboard Version

`POST /api/dashboards/uid/:uid/restore`

Restores a dashboard to a specific version using UID.

{{< admonition type="note" >}}
This API is deprecated. When `/apis/dashboards.grafana.app/v1` is released, you can restore a dashboard by reading it from history and then creating it again.
{{< /admonition >}}

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action             | Scope                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `dashboards:write` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
POST /api/dashboards/uid/cIBgcSjkk/restore HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "version": 1
}
```

JSON Body schema:

- **version** – Required. The version number to restore the dashboard to.

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "slug": "my-dashboard",
  "version": 3,
  "id": 1,
  "uid": "cIBgcSjkk",
  "url": "/d/cIBgcSjkk/my-dashboard",
  "folderUid": "l3KqBxCMz"
}
```

Status Codes:

- **200** – OK
- **400** – Bad request (invalid version or request data)
- **401** – Unauthorized
- **403** – Access denied
- **404** – Dashboard or version not found

## Import Dashboard

`POST /api/dashboards/import`

Imports a dashboard from a plugin or JSON.

**Required permissions**

See note in the [introduction](#dashboard-api) for an explanation.

<!-- prettier-ignore-start -->
| Action              | Scope |
| ------------------- | ----- |
| `dashboards:create` | n/a   |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request (from plugin)**:

```http
POST /api/dashboards/import HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "pluginId": "grafana-piechart-panel",
  "path": "dashboards/piechart.json",
  "overwrite": false,
  "inputs": [
    {
      "name": "DS_PROMETHEUS",
      "type": "datasource",
      "pluginId": "prometheus",
      "value": "prometheus"
    }
  ],
  "folderUid": "l3KqBxCMz"
}
```

**Example Request (from JSON)**:

```http
POST /api/dashboards/import HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "dashboard": {
    "title": "My Imported Dashboard",
    "panels": [],
    "schemaVersion": 16,
    "version": 0
  },
  "overwrite": false,
  "inputs": [
    {
      "name": "DS_PROMETHEUS",
      "type": "datasource",
      "pluginId": "prometheus",
      "value": "prometheus"
    }
  ],
  "folderUid": "l3KqBxCMz"
}
```

JSON Body schema:

- **pluginId** – ID of the plugin to import the dashboard from (use either pluginId or dashboard).
- **path** – Path to the dashboard JSON within the plugin.
- **dashboard** – Complete dashboard JSON model (use either pluginId or dashboard).
- **overwrite** – Set to true to overwrite an existing dashboard with the same uid.
- **inputs** – Array of input variable mappings for the dashboard.
- **inputs.name** – Name of the input variable.
- **inputs.type** – Type of input (e.g., `datasource`).
- **inputs.pluginId** – Plugin ID for datasource inputs.
- **inputs.value** – Value to set for the input variable.
- **folderUid** – UID of the folder to import the dashboard into.
- **folderId** – Deprecated. ID of the folder to import the dashboard into.

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "pluginId": "grafana-piechart-panel",
  "title": "Pie Chart Dashboard",
  "imported": true,
  "importedUri": "db/pie-chart-dashboard",
  "importedUrl": "/d/abc123/pie-chart-dashboard",
  "slug": "pie-chart-dashboard",
  "dashboardId": 1,
  "folderId": 2,
  "folderUid": "l3KqBxCMz",
  "importedRevision": 1,
  "revision": 1,
  "description": "",
  "path": "dashboards/piechart.json",
  "removed": false
}
```

Status Codes:

- **200** – OK
- **400** – Bad request (invalid JSON or missing required fields)
- **401** – Unauthorized
- **403** – Quota reached
- **412** – Precondition failed (dashboard with same UID exists and overwrite is false)
- **422** – Unprocessable entity (dashboard or pluginId must be provided)

## Public Dashboards

Public dashboards allow you to share dashboards publicly without requiring authentication. The following endpoints are available when public dashboards are enabled in your Grafana configuration.

### List Public Dashboards

`GET /api/dashboards/public-dashboards`

Gets a list of all public dashboards in the organization.

**Query parameters**:

- **`query`** (optional): Search query to filter public dashboards by name.
- **`page`** (optional): Page number for pagination. Defaults to 1.
- **`perpage`** (optional): Number of results per page. Defaults to 1000.

**Example Request**:

```http
GET /api/dashboards/public-dashboards?page=1&perpage=10 HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "publicDashboards": [
    {
      "uid": "abc123",
      "accessToken": "a1b2c3d4e5f6",
      "dashboardUid": "cIBgcSjkk",
      "title": "My Public Dashboard",
      "isEnabled": true
    }
  ],
  "totalCount": 1,
  "page": 1,
  "perPage": 10
}
```

Status Codes:

- **200** – OK
- **401** – Unauthorized
- **403** – Access denied
- **500** – Internal server error

### Get Public Dashboard

`GET /api/dashboards/uid/:dashboardUid/public-dashboards`

Gets the public dashboard configuration for a specific dashboard.

**Required permissions**

<!-- prettier-ignore-start -->
| Action            | Scope                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards:read` | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
GET /api/dashboards/uid/cIBgcSjkk/public-dashboards HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "uid": "abc123",
  "dashboardUid": "cIBgcSjkk",
  "accessToken": "a1b2c3d4e5f6",
  "isEnabled": true,
  "annotationsEnabled": false,
  "timeSelectionEnabled": true,
  "share": "public"
}
```

Status Codes:

- **200** – OK
- **400** – Bad request (invalid dashboard UID)
- **401** – Unauthorized
- **403** – Access denied
- **404** – Public dashboard not found
- **500** – Internal server error

### Create Public Dashboard

`POST /api/dashboards/uid/:dashboardUid/public-dashboards`

Creates a public dashboard for the specified dashboard.

**Required permissions**

<!-- prettier-ignore-start -->
| Action                     | Scope                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards.public:write`  | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
POST /api/dashboards/uid/cIBgcSjkk/public-dashboards HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "isEnabled": true,
  "annotationsEnabled": false,
  "timeSelectionEnabled": true,
  "share": "public"
}
```

JSON Body schema:

- **uid** – Optional. A unique identifier for the public dashboard. If not provided, one is generated.
- **accessToken** – Optional. A custom access token for the public dashboard URL. If not provided, one is generated.
- **isEnabled** – Whether the public dashboard is enabled.
- **annotationsEnabled** – Whether annotations are visible on the public dashboard.
- **timeSelectionEnabled** – Whether time range selection is allowed on the public dashboard.
- **share** – Share type. Can be `public` or `email` (email requires Grafana Enterprise).

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "uid": "abc123",
  "dashboardUid": "cIBgcSjkk",
  "accessToken": "a1b2c3d4e5f6",
  "isEnabled": true,
  "annotationsEnabled": false,
  "timeSelectionEnabled": true,
  "share": "public"
}
```

Status Codes:

- **200** – OK
- **400** – Bad request (invalid UID or access token)
- **401** – Unauthorized
- **403** – Access denied
- **500** – Internal server error

### Update Public Dashboard

`PATCH /api/dashboards/uid/:dashboardUid/public-dashboards/:uid`

Updates an existing public dashboard configuration.

**Required permissions**

<!-- prettier-ignore-start -->
| Action                     | Scope                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards.public:write`  | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
PATCH /api/dashboards/uid/cIBgcSjkk/public-dashboards/abc123 HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "isEnabled": false,
  "timeSelectionEnabled": false
}
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "uid": "abc123",
  "dashboardUid": "cIBgcSjkk",
  "accessToken": "a1b2c3d4e5f6",
  "isEnabled": false,
  "annotationsEnabled": false,
  "timeSelectionEnabled": false,
  "share": "public"
}
```

Status Codes:

- **200** – OK
- **400** – Bad request (invalid UID)
- **401** – Unauthorized
- **403** – Access denied
- **500** – Internal server error

### Delete Public Dashboard

`DELETE /api/dashboards/uid/:dashboardUid/public-dashboards/:uid`

Deletes a public dashboard configuration.

**Required permissions**

<!-- prettier-ignore-start -->
| Action                     | Scope                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `dashboards.public:write`  | <ul><li>`dashboards:*`</li><li>`dashboards:uid:*`</li><li>`folders:*`</li><li>`folders:uid:*`</li></ul> |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
DELETE /api/dashboards/uid/cIBgcSjkk/public-dashboards/abc123 HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
```

Status Codes:

- **200** – OK
- **400** – Bad request (invalid UID)
- **401** – Unauthorized
- **403** – Access denied
- **500** – Internal server error

### View Public Dashboard

`GET /api/public/dashboards/:accessToken`

Retrieves a public dashboard by its access token. This endpoint doesn't require authentication.

**Example Request**:

```http
GET /api/public/dashboards/a1b2c3d4e5f6 HTTP/1.1
Accept: application/json
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "meta": {
    "isSnapshot": false,
    "type": "db",
    "canSave": false,
    "canEdit": false,
    "canAdmin": false,
    "canStar": false,
    "canDelete": false,
    "slug": "my-public-dashboard"
  },
  "dashboard": {
    "title": "My Public Dashboard",
    "panels": [],
    "schemaVersion": 16
  }
}
```

Status Codes:

- **200** – OK
- **400** – Bad request (invalid access token)
- **404** – Public dashboard not found or not enabled

## Dashboard Snapshots

Dashboard snapshots are a way to share an interactive dashboard publicly. A snapshot shares all dashboard data at the moment the snapshot was created.

### Create Dashboard Snapshot

`POST /api/snapshots`

Creates a new dashboard snapshot.

{{< admonition type="note" >}}
This endpoint is designed for the Grafana UI. When creating a snapshot using the API, you must provide the full dashboard payload including the snapshot data.
{{< /admonition >}}

**Required permissions**

<!-- prettier-ignore-start -->
| Action               | Scope                                   |
| -------------------- | --------------------------------------- |
| `snapshots:create`   | n/a                                     |
| `dashboards:read`    | `dashboards:uid:<dashboard_uid>`        |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
POST /api/snapshots HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk

{
  "dashboard": {
    "uid": "cIBgcSjkk",
    "title": "My Dashboard Snapshot",
    "panels": [
      {
        "id": 1,
        "title": "Panel 1",
        "type": "graph",
        "snapshotData": [
          {"time": 1609459200000, "value": 100}
        ]
      }
    ],
    "schemaVersion": 16
  },
  "name": "my-snapshot",
  "expires": 3600,
  "external": false
}
```

JSON Body schema:

- **dashboard** – Required. The complete dashboard JSON model with snapshot data.
- **name** – Optional. A name for the snapshot.
- **expires** – Optional. Expiration time in seconds. 0 means the snapshot never expires.
- **external** – Optional. If true, the snapshot is created on an external server.
- **key** – Optional. A custom key for the snapshot URL.
- **deleteKey** – Optional. A custom key for deleting the snapshot.

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "key": "AbCdEfGhIj",
  "deleteKey": "XyZ123456",
  "url": "/dashboard/snapshot/AbCdEfGhIj",
  "deleteUrl": "/api/snapshots-delete/XyZ123456",
  "id": 1
}
```

Status Codes:

- **200** – OK
- **401** – Unauthorized
- **403** – Access denied (snapshots disabled or insufficient permissions)
- **500** – Internal server error

### Get Dashboard Snapshot

`GET /api/snapshots/:key`

Gets a dashboard snapshot by its key.

**Example Request**:

```http
GET /api/snapshots/AbCdEfGhIj HTTP/1.1
Accept: application/json
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=3600

{
  "meta": {
    "isSnapshot": true,
    "type": "snapshot",
    "canSave": false,
    "canEdit": false,
    "canAdmin": false,
    "canStar": false,
    "canDelete": false,
    "created": "2025-01-15T10:00:00Z",
    "expires": "2025-01-16T10:00:00Z"
  },
  "dashboard": {
    "title": "My Dashboard Snapshot",
    "panels": [],
    "schemaVersion": 16
  }
}
```

Status Codes:

- **200** – OK
- **400** – Bad request (empty snapshot key)
- **404** – Snapshot not found or expired
- **500** – Internal server error

### Delete Dashboard Snapshot

`DELETE /api/snapshots/:key`

Deletes a dashboard snapshot by its key.

**Required permissions**

<!-- prettier-ignore-start -->
| Action             | Scope |
| ------------------ | ----- |
| `snapshots:delete` | n/a   |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Example Request**:

```http
DELETE /api/snapshots/AbCdEfGhIj HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Snapshot deleted. It might take an hour before it's cleared from any CDN caches.",
  "id": 1
}
```

Status Codes:

- **200** – OK
- **403** – Access denied (insufficient permissions)
- **404** – Snapshot not found
- **500** – Internal server error

### Delete Dashboard Snapshot by Delete Key

`GET /api/snapshots-delete/:deleteKey`

Deletes a dashboard snapshot using its delete key. This endpoint can be used without authentication when snapshot public mode is enabled.

**Example Request**:

```http
GET /api/snapshots-delete/XyZ123456 HTTP/1.1
Accept: application/json
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Snapshot deleted. It might take an hour before it's cleared from any CDN caches."
}
```

Status Codes:

- **200** – OK
- **401** – Unauthorized (snapshot public mode not enabled and no authentication)
- **403** – Access denied (snapshots disabled)
- **404** – Snapshot not found
- **500** – Internal server error

### Search Dashboard Snapshots

`GET /api/dashboard/snapshots`

Lists dashboard snapshots.

**Required permissions**

<!-- prettier-ignore-start -->
| Action           | Scope |
| ---------------- | ----- |
| `snapshots:read` | n/a   |
{ .no-spacing-list }
<!-- prettier-ignore-end -->

**Query parameters**:

- **`query`** (optional): Search query to filter snapshots by name.
- **`limit`** (optional): Maximum number of snapshots to return. Defaults to 1000.

**Example Request**:

```http
GET /api/dashboard/snapshots?query=my-snapshot&limit=10 HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "name": "my-snapshot",
    "key": "AbCdEfGhIj",
    "orgId": 1,
    "userId": 1,
    "external": false,
    "externalUrl": "",
    "expires": "2025-01-16T10:00:00Z",
    "created": "2025-01-15T10:00:00Z",
    "updated": "2025-01-15T10:00:00Z"
  }
]
```

Status Codes:

- **200** – OK
- **500** – Internal server error

### Get Snapshot Sharing Settings

`GET /api/snapshot/shared-options`

Gets the snapshot sharing settings for the instance.

**Example Request**:

```http
GET /api/snapshot/shared-options HTTP/1.1
Accept: application/json
Content-Type: application/json
Authorization: Bearer eyJrIjoiT0tTcG1pUlY2RnVKZTFVaDFsNFZXdE9ZWmNrMkZYbk
```

**Example Response**:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "snapshotEnabled": true,
  "externalSnapshotURL": "https://snapshots.grafana.com",
  "externalSnapshotName": "Grafana.com",
  "externalEnabled": true
}
```

Status Codes:

- **200** – OK
- **401** – Unauthorized
