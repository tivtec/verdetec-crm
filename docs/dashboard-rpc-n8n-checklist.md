# Dashboard RPC (`flutterflow_dashboard_001`) - n8n checklist

This checklist prevents the `[{ }]` false-success scenario and keeps payload mapping aligned with SQL.

## 1) Final fields from `Edit Fields`

Use these exact output keys:

- `p_data_inicio` (string, `dd-MM-yyyy`)
- `p_data_fim` (string, `dd-MM-yyyy`)
- `p_tipo_acesso_2` (string)
- `p_id_usuario` (number)
- `vertical` (string UUID or empty)

Do not reuse the Agenda mock vertical UUID (`0ec7796e-16d8-469f-a098-6c33063d7384`) in the dashboard flow.

## 2) RPC body mapping

In the HTTP node body, map exactly:

```json
{
  "p_data_inicio": "={{$json.p_data_inicio}}",
  "p_data_fim": "={{$json.p_data_fim}}",
  "p_tipo_acesso_2": "={{$json.p_tipo_acesso_2}}",
  "p_id_usuario": "={{$json.p_id_usuario}}",
  "vertical": "={{$json.vertical}}"
}
```

## 3) Error visibility

In the HTTP node:

- Disable `Continue On Fail`.
- Disable `output empty item if nothing would normally be returned`.

If RPC fails, the node must fail explicitly instead of returning an empty object.
