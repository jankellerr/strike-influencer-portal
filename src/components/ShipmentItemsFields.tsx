"use client";

import { useState } from "react";
import { Button, Input, Label, Select } from "@/components/ui";
import { formatBRL } from "@/lib/format";

export interface ShipmentProductOption {
  id: string;
  title: string;
  costPerItem: number | null;
}

interface Row {
  key: number;
  productId: string;
  quantity: number;
  unitCost: string;
}

let nextRowKey = 0;

/**
 * Client-side add/remove repeater for a shipment's line items. Each row
 * submits as part of the parallel `productId[]` / `quantity[]` / `unitCost[]`
 * arrays a plain `<form method="POST">` produces -- no fetch/JS submit
 * needed, matching the rest of the admin's server-action-style forms.
 */
export function ShipmentItemsFields({
  products,
  initialItems,
}: {
  products: ShipmentProductOption[];
  initialItems?: Array<{ productId: string; quantity: number; unitCost: number }>;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    (initialItems && initialItems.length > 0 ? initialItems : [{ productId: "", quantity: 1, unitCost: 0 }]).map(
      (item) => ({
        key: nextRowKey++,
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost ? String(item.unitCost) : "",
      }),
    ),
  );

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function handleProductChange(key: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateRow(key, { productId, unitCost: product?.costPerItem != null ? String(product.costPerItem) : "" });
  }

  const subtotal = rows.reduce((sum, row) => sum + row.quantity * (Number(row.unitCost) || 0), 0);

  return (
    <div>
      <Label>Produtos enviados</Label>
      <div className="mb-1 flex gap-2 text-xs font-medium uppercase tracking-wide text-strike-muted">
        <span className="flex-1">Produto</span>
        <span className="w-16">Qtd.</span>
        <span className="w-32">Custo unit. (R$)</span>
        <span className="w-16"></span>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2">
            <Select
              className="flex-1"
              name="productId[]"
              value={row.productId}
              onChange={(e) => handleProductChange(row.key, e.target.value)}
              required
            >
              <option value="">Selecione um produto…</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </Select>
            <Input
              className="w-16"
              type="number"
              min={1}
              step={1}
              name="quantity[]"
              value={row.quantity}
              onChange={(e) => updateRow(row.key, { quantity: Number(e.target.value) })}
              required
            />
            <Input
              className="w-32"
              type="number"
              min={0}
              step="0.01"
              name="unitCost[]"
              value={row.unitCost}
              onChange={(e) => updateRow(row.key, { unitCost: e.target.value })}
              required
            />
            <Button
              type="button"
              variant="ghost"
              className="w-16 px-2 py-2 text-xs"
              disabled={rows.length === 1}
              onClick={() => setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== row.key) : prev))}
            >
              Remover
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="px-3 py-1.5 text-xs"
          onClick={() => setRows((prev) => [...prev, { key: nextRowKey++, productId: "", quantity: 1, unitCost: "" }])}
        >
          + Adicionar produto
        </Button>
        <span className="text-sm text-strike-muted">
          Subtotal produtos: <span className="font-semibold text-strike-black">{formatBRL(subtotal)}</span>
        </span>
      </div>
    </div>
  );
}
