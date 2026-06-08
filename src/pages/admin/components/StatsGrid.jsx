const StatsGrid = ({ stats }) => {
  const items = [
    {
      label: "Total Requests",
      value: stats?.total ?? 0,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      color: "from-yellow-500 to-yellow-600",
    },
    {
      label: "Playing",
      value: stats?.playing ?? 0,
      color: "from-pink-500 to-pink-600",
    },
    {
      label: "Completed",
      value: stats?.completed ?? 0,
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {items.map((stat, idx) => (
        <div
          key={idx}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 shadow-lg"
        >
          <p className="text-gray-300 text-sm mb-2">{stat.label}</p>
          <p
            className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
