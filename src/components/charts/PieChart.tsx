import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any; // Add index signature
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  height?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  label?: boolean;
}

export function PieChart({
  data,
  title,
  height = 300,
  innerRadius = '60%',
  outerRadius = '80%',
  label = true,
}: PieChartProps) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-center font-medium mb-4">{title}</h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={5}
              dataKey="value"
              label={label ? (props: any) => {
                const { name, percent } = props as { name: string; percent: number };
                return `${name}: ${(percent * 100).toFixed(0)}%`;
              } : false}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, 'Quantity']}
            />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
