import { useState, useEffect } from 'react'

interface LearningPanelProps {
  userId?: string
}

export function LearningPanel({ userId = 'demo-user' }: LearningPanelProps) {
  const [learningPoints, setLearningPoints] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLearningPoints()
  }, [userId])

  const fetchLearningPoints = async () => {
    try {
      const res = await fetch(`/api/demo/learning?user_id=${userId}`)
      const data = await res.json()
      setLearningPoints(data.learning_points || [])
    } catch (err) {
      console.error('Failed to fetch learning points:', err)
    }
    setLoading(false)
  }

  if (loading || learningPoints.length === 0) {
    return null
  }

  return (
    <div className="card learning-panel">
      <h3>🧠 系统本周学到了</h3>
      <ul className="learning-list">
        {learningPoints.map((point, i) => (
          <li key={i} className="learning-item">
            <span className="learning-bullet">•</span>
            <span className="learning-text">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
