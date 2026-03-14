import Heroo from "./Components/Heroo"
import { redirect } from "next/navigation"

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{
    __clerk_ticket?: string | string[]
    __clerk_status?: string | string[]
  }>
}) => {
  const params = await searchParams
  const ticketParam = params.__clerk_ticket
  const statusParam = params.__clerk_status
  const ticket = Array.isArray(ticketParam) ? ticketParam[0] : ticketParam
  const status = Array.isArray(statusParam) ? statusParam[0] : statusParam

  if (ticket) {
    const qs = new URLSearchParams({ __clerk_ticket: ticket })
    if (status) {
      qs.set("__clerk_status", status)
    }
    redirect(`/sign-up?${qs.toString()}`)
  }

  return (

    <div className=' w-full min-h-screen '>
      
    <Heroo/>

    </div>
  )
}

export default page