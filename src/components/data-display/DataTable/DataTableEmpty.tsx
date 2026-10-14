type DataTableEmptyProps = {
  colSpan: number;
  message: string;
};

export function DataTableEmpty({ colSpan, message }: DataTableEmptyProps) {
  return (
    <tr>
      <td
        className="px-4 py-10 text-center text-sm text-[var(--text-muted)]"
        colSpan={colSpan}
      >
        {message}
      </td>
    </tr>
  );
}
