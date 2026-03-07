export interface Group {
  id: number;
  title: string;
  order: number;
  icon?: string;
  links?: Link[];
}

export interface Link {
  id: number;
  group_id: number;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface WidgetMetrics {
  cpu: { value: number; unit: string };
  ram: { value: number; unit: string };
  disk: { value: number; unit: string };
}
