import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  RadialBarChart, RadialBar, Legend
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Home', href: '/admin' },
];

export default function Home() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Home" />
      <div className="flex flex-col gap-6 p-4">

        <Card>
          <CardHeader>
            <CardTitle>Welcome to the Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is your admin dashboard where you can manage all aspects of the application.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
