import React from 'react'
import { LoginRequired } from './auth'

export class AppError extends Error {}
export class UnauthenticatedError extends AppError {}

type AppErrorBoundaryState = {
  error: AppError | undefined
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: undefined,
  }

  static getDerivedStateFromError(error: AppError) {
    return { error }
  }

  componentDidCatch(error: any) {
    if (!(error instanceof AppError)) {
      throw error
    }
  }

  render() {
    const { error } = this.state
    // TODO: once we have more "AppErrors", we need to differentiate here
    return error ? <LoginRequired /> : this.props.children
  }
}
