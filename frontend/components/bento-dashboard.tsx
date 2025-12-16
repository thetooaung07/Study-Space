// "use client"

// import { Card } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Settings, Clock, Briefcase, ChevronRight } from "lucide-react"
// import { useEffect, useState } from "react"
// import { api } from "@/lib/api"
// import { StudySessionDTO } from "@/types"
// import { formatDistanceToNow } from "date-fns"

// export function BentoDashboard() {
//   const [recentSessions, setRecentSessions] = useState<StudySessionDTO[]>([])
//   const [loading, setLoading] = useState(true)
//   const userId = 1 // Mock user ID

//   useEffect(() => {
//     const fetchHistory = async () => {
//       try {
//         const data = await api.get<StudySessionDTO[]>(`/sessions/user/${userId}/history`)
//         setRecentSessions(data.slice(0, 5))
//       } catch (error) {
//         console.error("Failed to fetch session history:", error)
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchHistory()
//   }, [])

//   return (
//     <div className="w-full p-6">
//       <div className="grid grid-cols-3 gap-4 mb-8 auto-rows-[200px]">
//         {/* Profile Card - Top Left */}
//         <Card className="col-span-1 row-span-1 p-6 flex flex-col justify-between  border-gray-200 hover:shadow-md transition-all">
//           <div>
//             <div className="flex items-center gap-3 mb-4">
//               <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
//                 <Settings className="w-6 h-6 text-gray-900" />
//               </div>
//               <h3 className="font-semibold text-gray-900">Profile</h3>
//             </div>
//             <p className="text-sm text-gray-600 mb-4">Manage your account settings and preferences.</p>
//           </div>
//         </Card>

//         {/* Recent Sessions - Right (2 rows, 2 columns) */}
//         <Card className="col-span-2 row-span-2 p-6 flex flex-col justify-between bg-white border-gray-200 hover:shadow-md transition-all">
//           <div className="w-full h-full flex flex-col">
//             <div className="flex justify-between items-center mb-4">
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
//                   <Clock className="w-6 h-6 text-gray-900" />
//                 </div>
//                 <h3 className="font-semibold text-gray-900">Recent Sessions</h3>
//               </div>
//               <Button variant="ghost" className="justify-between bg-transparent" size="sm">
//                 <span>View All</span>
//                 <ChevronRight className="w-4 h-4" />
//               </Button>
//             </div>
            
//             <div className="space-y-3 overflow-y-auto flex-1 pr-2">
//               {loading ? (
//                  <p className="text-center text-gray-500 py-8">Loading history...</p>
//               ) : recentSessions.length > 0 ? (
//                 recentSessions.map((session) => (
//                   <div
//                     key={session.id}
//                     className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
//                   >
//                     <div className="flex items-center gap-3">
//                       <div className={`w-2 h-2 rounded-full ${session.subject === 'MATH' ? 'bg-blue-400' : 'bg-green-400'}`} />
//                       <div>
//                         <p className="text-sm font-medium text-gray-900">{session.title || session.subject}</p>
//                         <p className="text-xs text-gray-500">
//                           {formatDistanceToNow(new Date(session.endTime || session.startTime), { addSuffix: true })}
//                         </p>
//                       </div>
//                     </div>
//                     <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
//                       {session.durationMinutes || 0}m
//                     </span>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-center text-gray-500 py-8">No completed sessions yet.</p>
//               )}
//             </div>
//           </div>
//         </Card>

//         {/* Workspace Card - Bottom Left */}
//         <Card className="col-span-1 row-span-1 p-6 flex flex-col justify-between bg-white border-gray-200 hover:shadow-md transition-all">
//           <div>
//             <div className="flex items-center gap-3 mb-4">
//               <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
//                 <Briefcase className="w-6 h-6 text-gray-900" />
//               </div>
//               <h3 className="font-semibold text-gray-900">Workspace</h3>
//             </div>
//             <p className="text-sm text-gray-600 mb-4">Access your study materials and notes.</p>
//           </div>
//         </Card>
//       </div>
//     </div>
//   )
// }
