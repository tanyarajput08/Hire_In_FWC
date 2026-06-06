import { ResponsiveContainer } from 'recharts'

function ChartBox({ children }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

export default ChartBox
