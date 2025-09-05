"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "May", LTFR: 1800, LTI: 12 },
  { month: "Jun", LTFR: 1500, LTI: 10 },
  { month: "Jul", LTFR: 1400, LTI: 15 },
  { month: "Aug", LTFR: 1200, LTI: 9 },
  { month: "Sep", LTFR: 1300, LTI: 11 },
  { month: "Oct", LTFR: 1250, LTI: 10 },
];

const SafetyChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="month" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip />
        <Bar dataKey="LTFR" fill="#1976d2" />
        <Line type="monotone" dataKey="LTI" stroke="#f4d03f" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SafetyChart;
