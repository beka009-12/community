import { ReactNode } from "react";
import Link from "next/link";
import scss from "./admin-ui.module.scss";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  // The first column becomes a link to the row's detail page.
  rowHref?: (row: T) => string;
  empty: string;
  rowClassName?: (row: T) => string | undefined;
}

function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  empty,
  rowClassName,
}: DataTableProps<T>) {
  if (rows.length === 0) return <p className={scss.empty}>{empty}</p>;

  return (
    <div className={scss.tableWrap}>
      <table className={scss.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={rowClassName?.(row)}>
              {columns.map((column, index) => (
                <td key={column.key} data-label={column.label}>
                  {index === 0 && rowHref ? (
                    <Link href={rowHref(row)} className={scss.table__link}>
                      {column.render(row)}
                    </Link>
                  ) : (
                    column.render(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
