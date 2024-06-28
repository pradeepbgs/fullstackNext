'use client'

import MessageCard from '@/components/MessageCard'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { acceptMessageSchema } from '@/schema/acceptMessageSchema'
import { apiResponse } from '@/types/apiResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { Loader2, RefreshCcw } from 'lucide-react'
import { User } from 'next-auth'
import { useSession } from 'next-auth/react'
import React, {useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

function DashBoardPage() {
  const [messages,setMessages] = useState([])
  const [isLoading,setIsLoading] = useState(false)
  const [isSwitchLoading,setIsSwitchLoading] = useState(false)
  const {toast} = useToast()

  const handleDeleteMessage = async (message_id:string) => {
    setMessages(messages.filter((message:any) => message._id !== message_id))
  }

  const {data:session} = useSession()

  const form = useForm({
    resolver:zodResolver(acceptMessageSchema)
  })

  const {register,watch,setValue} = form

  const acceptMessages = watch('acceptMessages')

  const fetchAcceptMessage = useCallback(async () => {
    setIsSwitchLoading(true)
    try {
      const res = await axios.get<apiResponse>('/api/accept-message')
      setValue('acceptMessages',res?.data?.isAcceptingMessages)
    } catch (error:any) {
      const axiosError = error as AxiosError<apiResponse>
      toast({
        title: 'Error',
        description:axiosError?.response?.data?.message ?? "Failed to fetch message settings", 
        variant:'destructive'
      })    
    } finally {
      setIsSwitchLoading(false)
    }
  },[setValue])

  const fetchMessages = useCallback(async(refresh:boolean = false) => {
    setIsLoading(true)
    setIsSwitchLoading(false)

    try {
      const res = await axios.get<apiResponse>('/api/get-messages');
      console.log(res.data.messages)
      setMessages(res?.data?.messages ?? [])
      if (refresh) {
        toast({
          title: 'refreshed messages',
          description: 'Messages refreshed successfully',
        })
      }

    } catch (error:any) {
      const axiosError = error as AxiosError<apiResponse>
      toast({
        title: 'Error',
        description:axiosError?.response?.data?.message ?? "Failed to fetch message settings", 
        variant:'destructive'
      })   
    } finally {
      setIsLoading(false)
      setIsSwitchLoading(false)
    }
  },[setIsLoading,setMessages])

  useEffect(() => {
    if (!session ?? !session?.user) return;
    fetchMessages()
    fetchAcceptMessage()
  },[session,setValue,fetchAcceptMessage,fetchMessages])

  // handle swithc change of accept message

  const handleSwitchChange = async () => {
    try {
      const res = await axios.post<apiResponse>('/api/accept-message', { acceptMessages: !acceptMessages })
      setValue('acceptMessages', !acceptMessages)
      toast({
        title: 'Success',
        description: res?.data?.message ?? 'Message settings updated successfully',
      })
    } catch (error) {
      const axiosError = error as AxiosError<apiResponse>
      toast({
        title: 'Error',
        description:axiosError?.response?.data?.message ?? "Failed to fetch message settings", 
        variant:'destructive'
      })  
    }
  }

  if (!session ?? !session?.user){
    return (
      <div>
        <Navbar />
        <p>please login</p>
      </div>
    )
  }

  const {username} = session?.user as User
  const baseURI = `${window.location.protocol}//${window.location.host}`
  const profileUrl = `${baseURI}/u/${username}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl)
    toast({
      title: 'URI Copied',
      description: 'Link copied to clipboard',
    })
  }


  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Copy Your Unique Link</h2>{' '}
        <div className="flex items-center">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="input input-bordered w-full p-2 mr-2"
          />
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
      </div>

      <div className="mb-4">
        <Switch
          {...register('acceptMessages')}
          checked={acceptMessages}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitchLoading}
        />
        <span className="ml-2">
          Accept Messages: {acceptMessages ? 'On' : 'Off'}
        </span>
      </div>
      <Separator />

      <Button
        className="mt-4"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          fetchMessages(true);
        }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
      </Button>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageCard
              key={message?._id}
              message={message}
              onMessageDelete={handleDeleteMessage}
            />
          ))
        ) : (
          <p>No messages to display.</p>
        )}
      </div>
    </div>
  )
}

export default DashBoardPage