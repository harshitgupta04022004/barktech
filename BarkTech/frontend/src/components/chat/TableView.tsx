interface TableViewData {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  footer?: { label: string; values: (string | number)[] };
}

interface TableViewProps {
  data: TableViewData;
}

export function TableView({ data }: TableViewProps) {
  if (!data.headers || data.headers.length === 0) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden my-2">
      {data.title && (
        <div className="px-4 py-2.5 bg-muted border-b border-border">
          <span className="text-sm font-bold text-foreground">{data.title}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {data.headers.map((header, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-3 py-2 text-foreground whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {data.footer && (
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30 font-medium">
                <td className="px-3 py-2 text-foreground">{data.footer.label}</td>
                {data.footer.values.map((val, i) => (
                  <td key={i} className="px-3 py-2 text-foreground">
                    {val}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
