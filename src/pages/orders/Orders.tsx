// src/pages/Orders.tsx
import { useEffect, useRef, useState } from 'react';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';

interface Order {
  id?: number;
  order_number: string | number;
  country: string;
  customer: string;
  affiliates: string;
  divisions: string;
  objects_order: string;
  equipments: string;
  works: string;
  tender_number: string;
  pqs: string;
  order_status: string;
  ship_date: string | null;
}

const Orders = () => {
  const tableRef = useRef<HTMLTableElement | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 1) Загружаем данные из API
  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch('/api/orders/');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        let items: Order[] = [];

        if (Array.isArray(json)) {
          // API вернул просто массив
          items = json as Order[];
        } else if (Array.isArray(json.results)) {
          // DRF-пагинатор
          items = json.results as Order[];
        } else if (Array.isArray(json.data)) {
          // на случай если API вернёт { data: [...] }
          items = json.data as Order[];
        }

        if (isMounted) {
          setOrders(items);
        }
      } catch (error: unknown) {
        console.error('Ошибка загрузки заказов:', error);
        if (isMounted) {
          setLoadError('Не удалось загрузить список заказов.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2) Инициализируем DataTables, когда данные загружены
  useEffect(() => {
    if (!tableRef.current) {
      return;
    }

    // Если данных ещё нет — таблицу не создаём
    if (orders.length === 0) {
      return;
    }

    // Инициализация DataTable
    const dt = new DataTable(tableRef.current, {
      data: orders,
      processing: false,
      serverSide: false,
      responsive: false,
      autoWidth: false,
      scrollX: true,
      scrollCollapse: true,
      order: [],

      dom:
        "<'row mb-3 mt-1'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-md-end'f>>" +
        "<'row'<'col-sm-12'tr>>" +
        "<'row mt-3'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",

      columns: [
        {
          data: 'order_number',
          title: '№',
          className: 'dt-center',
          width: '5%',
        },
        {
          data: 'country',
          title: 'Страна',
          className: 'dt-center',
          width: '7%',
        },
        {
          data: 'customer',
          title: 'Заказчик',
          className: 'dt-center',
          width: '10%',
        },
        {
          data: 'affiliates',
          title: 'Филиал',
          className: 'dt-center',
          width: '10%',
        },
        {
          data: 'divisions',
          title: 'Производственное отделение',
          className: 'dt-center',
          width: '10%',
        },
        {
          data: 'objects_order',
          title: 'Объект',
          className: 'dt-center',
          width: '10%',
        },
        {
          data: 'equipments',
          title: 'Оборудование',
          className: 'dt-center',
          width: '10%',
        },
        {
          data: 'works',
          title: 'Работы',
          className: 'dt-center',
          width: '10%',
        },
        {
          data: 'tender_number',
          title: '№ тендера',
          className: 'dt-center',
          width: '8%',
        },
        {
          data: 'pqs',
          title: 'Участник запроса',
          className: 'dt-center',
          width: '10%',
        },
        {
          data: 'order_status',
          title: 'Статус заказа',
          className: 'dt-center',
          width: '10%',
          render: (data: unknown) => {
            const value = typeof data === 'string' ? data : '';
            return value === 'Создан' ? '' : value;
          },
        },
        {
          data: 'ship_date',
          title: 'Дата отгрузки',
          className: 'dt-center',
          width: '8%',
          render: (data: unknown) => {
            const value = typeof data === 'string' ? data : '';
            if (!value) return '';
            const parts = value.split('-');
            if (parts.length !== 3) return value;
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
          },
        },
      ],

      language: {
        url: '/static/json/datatables_ru.json', // можешь использовать свой файл
        search: '',
        searchPlaceholder: 'Поиск...',
      },

      lengthMenu: [
        [20, 50, 100],
        [20, 50, 100],
      ],

      initComplete: () => {
        const filterInputs = document.querySelectorAll<HTMLInputElement>(
          '.dataTables_filter input'
        );
        filterInputs.forEach((input) => {
          input.classList.add('form-control-sm');
        });

        const lengthSelects = document.querySelectorAll<HTMLSelectElement>(
          '.dataTables_length select'
        );
        lengthSelects.forEach((select) => {
          select.classList.add('form-select-sm');
        });
      },
    });

    // Обработка клика по строке — пока только лог, без открытия Django-шаблонов
    (dt as any).on('click', 'tbody tr', function (this: HTMLTableRowElement) {
      const rowData = (dt as any).row(this).data() as Order | null;
      if (!rowData) return;

      // Здесь можешь потом повесить React Router переход:
      // navigate(`/orders/${rowData.order_number}`);
      console.log('Выбрана строка заказа:', rowData);
    });

    return () => {
      dt.destroy();
    };
  }, [orders]);

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-[1600px] rounded-lg border border-border bg-card shadow-md p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-base font-semibold text-foreground">
              Список заказов (API /api/orders/)
            </h1>
          </div>
        </div>

        {isLoading && <div className="mb-3 text-sm text-muted-foreground">Загрузка заказов...</div>}

        {loadError && <div className="mb-3 text-sm text-destructive">{loadError}</div>}

        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="display w-full text-sm"
            // id можно оставить для дебага, но он DataTables не обязателен
            id="orders-table"
          >
            <thead>
              <tr>
                <th>№</th>
                <th>Страна</th>
                <th>Заказчик</th>
                <th>Филиал</th>
                <th>Производственное отделение</th>
                <th>Объект</th>
                <th>Оборудование</th>
                <th>Работы</th>
                <th>№ тендера</th>
                <th>Участник запроса</th>
                <th>Статус заказа</th>
                <th>Дата отгрузки</th>
              </tr>
            </thead>
            <tbody>{/* DataTables сам заполнит тело по data: orders */}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
