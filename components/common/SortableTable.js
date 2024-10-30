// components/common/SortableTable.js
import React, { useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import styles from './SortableTable.module.css';

const SortableTable = ({ columns, data }) => {
  const memoizedColumns = useMemo(() => columns, [columns]);
  const memoizedData = useMemo(() => data, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns: memoizedColumns, data: memoizedData }, useSortBy);

  return (
    <table {...getTableProps()} className={styles.sortableTable}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
            {headerGroup.headers.map((column) => (
              <th
                {...column.getHeaderProps(column.getSortByToggleProps())}
                key={column.id}
                className={
                  column.isSorted
                    ? column.isSortedDesc
                      ? styles.desc
                      : styles.asc
                    : ''
                }
              >
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.length > 0 ? (
          rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={row.id}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()} key={cell.column.id}>
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={columns.length} className={styles.noData}>
              No data available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default SortableTable;
