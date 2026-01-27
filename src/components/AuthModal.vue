<template>
  <v-container class="auth-container">
    <v-card class="auth-card">
      <v-card-title class="auth-title">
        <div class="title-brand">Blinthe</div>
        <div class="title-subtitle">Composable Metric Dashboard</div>
      </v-card-title>

      <v-card-text>
        <v-tabs v-model="tab" align-tabs="center">
          <v-tab value="signin">Sign In</v-tab>
          <v-tab value="signup">Create Account</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Sign In Tab -->
          <v-window-item value="signin">
            <div class="tab-content">
              <v-text-field
                v-model="signInUsername"
                label="Username"
                type="text"
                outlined
                density="comfortable"
                prepend-icon="mdi-account"
                :rules="[requiredRule]"
                @keyup.enter="handleSignIn"
              />

              <v-text-field
                v-model="signInPassword"
                label="Password"
                type="password"
                outlined
                density="comfortable"
                prepend-icon="mdi-lock"
                :rules="[requiredRule]"
                @keyup.enter="handleSignIn"
              />

              <v-btn
                block
                color="primary"
                size="large"
                :loading="loading"
                @click="handleSignIn"
              >
                Sign In
              </v-btn>

              <v-alert v-if="error" type="error" class="mt-4">
                {{ error }}
              </v-alert>
            </div>
          </v-window-item>

          <!-- Sign Up Tab -->
          <v-window-item value="signup">
            <div class="tab-content">
              <v-text-field
                v-model="signUpUsername"
                label="Username"
                type="text"
                outlined
                density="comfortable"
                prepend-icon="mdi-account-plus"
                :rules="[requiredRule, minLengthRule]"
              />

              <v-text-field
                v-model="signUpPassword"
                label="Password"
                type="password"
                outlined
                density="comfortable"
                prepend-icon="mdi-lock"
                :rules="[requiredRule, minLengthRule]"
              />

              <v-text-field
                v-model="signUpPasswordConfirm"
                label="Confirm Password"
                type="password"
                outlined
                density="comfortable"
                prepend-icon="mdi-lock-check"
                :rules="[requiredRule, matchPasswordRule]"
              />

              <v-btn
                block
                color="primary"
                size="large"
                :loading="loading"
                @click="handleSignUp"
              >
                Create Account
              </v-btn>

              <v-alert v-if="error" type="error" class="mt-4">
                {{ error }}
              </v-alert>

              <v-alert type="info" class="mt-4">
                <small
                  >Your password is used to derive an encryption key. It is never stored and cannot be
                  recovered if lost.</small
                >
              </v-alert>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables'
import { useAuthStore } from '@/stores/auth'

const { authenticate } = useAuth()
const authStore = useAuthStore()

const tab = ref('signin')
const loading = ref(false)
const error = ref<string | null>(null)

// Sign In
const signInUsername = ref('')
const signInPassword = ref('')

// Sign Up
const signUpUsername = ref('')
const signUpPassword = ref('')
const signUpPasswordConfirm = ref('')

// Validation rules
const requiredRule = (v: string) => !!v || 'This field is required'
const minLengthRule = (v: string) => (v && v.length >= 6) || 'Must be at least 6 characters'
const matchPasswordRule = (v: string) =>
  v === signUpPassword.value || 'Passwords do not match'

async function handleSignIn() {
  if (!signInUsername.value || !signInPassword.value) {
    error.value = 'Username and password required'
    return
  }

  loading.value = true
  error.value = null

  const result = await authenticate(signInUsername.value, signInPassword.value)

  if (result.success) {
    // Clear form
    signInUsername.value = ''
    signInPassword.value = ''
  } else {
    error.value = result.error || 'Authentication failed'
  }

  loading.value = false
}

async function handleSignUp() {
  if (!signUpUsername.value || !signUpPassword.value || !signUpPasswordConfirm.value) {
    error.value = 'All fields required'
    return
  }

  if (signUpPassword.value !== signUpPasswordConfirm.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (signUpPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true
  error.value = null

  const result = await authenticate(signUpUsername.value, signUpPassword.value)

  if (result.success) {
    // Switch to sign in tab
    signUpUsername.value = ''
    signUpPassword.value = ''
    signUpPasswordConfirm.value = ''
    tab.value = 'signin'
  } else {
    error.value = result.error || 'Account creation failed'
  }

  loading.value = false
}
</script>

<style scoped>
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
}

.auth-card {
  width: 100%;
  max-width: 450px;
  background-color: #16213e;
}

.auth-title {
  text-align: center;
  padding: 2rem 1rem 1rem;
}

.title-brand {
  font-size: 2.5rem;
  font-weight: bold;
  color: #00d4ff;
  letter-spacing: 2px;
}

.title-subtitle {
  font-size: 0.9rem;
  color: #a0a0a0;
  margin-top: 0.5rem;
}

.tab-content {
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

:deep(.v-tabs) {
  background-color: #1a1a2e;
}

:deep(.v-tab) {
  color: #a0a0a0;
}

:deep(.v-tab--selected) {
  color: #00d4ff;
}
</style>
