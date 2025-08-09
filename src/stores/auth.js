import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true,
    error: null,
    salesChannel: null,
    salesChannelLoaded: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userEmail: (state) => state.user?.email || '',
    userId: (state) => state.user?.id || null,
    userClubId: (state) => state.salesChannel?.bob_id || null,
    clubName: (state) => state.salesChannel?.name || '',
    salesChannelData: (state) => state.salesChannel,
    salesChannelUrl: (state) => state.salesChannel?.url || null,
    salesChannelId: (state) => state.salesChannel?.id || null
  },

  actions: {
    async initialize() {
      try {
        this.loading = true
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session) {
          this.session = session
          this.user = session.user
          await this.fetchSalesChannel()
        }
        
        // Listen for auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          this.session = session
          this.user = session?.user || null
          
          if (event === 'SIGNED_IN') {
            await this.fetchSalesChannel()
          } else if (event === 'SIGNED_OUT') {
            // Clear any cached data
            this.clearUserData()
          }
        })
      } catch (error) {
        console.error('Auth initialization error:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async signIn(email, password) {
      try {
        this.loading = true
        this.error = null
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        this.session = data.session
        this.user = data.user
        
        await this.fetchSalesChannel()
        
        return { success: true }
      } catch (error) {
        console.error('Sign in error:', error)
        this.error = error.message
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      try {
        this.loading = true
        const { error } = await supabase.auth.signOut()
        
        if (error) throw error
        
        this.clearUserData()
      } catch (error) {
        console.error('Sign out error:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchSalesChannel(forceRefresh = false) {
      try {
        console.log('Fetching sales channel...', forceRefresh ? '(forced refresh)' : '')
        
        // Call the edge function directly to get full response
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/get-sales-channel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.session?.access_token}`,
            'Content-Type': 'application/json',
          }
        })
        
        const responseText = await response.text()
        console.log('Raw response:', responseText)
        
        if (!response.ok) {
          console.error('Edge function failed:', {
            status: response.status,
            statusText: response.statusText,
            body: responseText
          })
          throw new Error(`Edge function failed: ${response.status} - ${responseText}`)
        }
        
        const data = JSON.parse(responseText)
        console.log('Parsed response:', data)
        
        // Log debug info if available
        if (data.debug) {
          console.warn('Sales channel debug info:', data.debug)
        }
        
        this.salesChannel = data.salesChannel
        console.log('Sales channel set:', this.salesChannel)
        this.salesChannelLoaded = true
      } catch (error) {
        console.error('Error fetching sales channel:', error)
        // Set default values if fetch fails
        this.salesChannel = {
          id: null,
          bob_id: null,
          name: 'Nenalezeno',
          url: null
        }
        this.salesChannelLoaded = true
      }
    },
    
    async refreshSalesChannel() {
      // Force refresh the sales channel data
      await this.fetchSalesChannel(true)
    },

    clearUserData() {
      this.user = null
      this.session = null
      this.salesChannel = null
      this.salesChannelLoaded = false
      this.error = null
    }
  }
})