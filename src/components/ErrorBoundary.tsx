import React, { ErrorInfo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center items-center bg-red-50 p-6">
          <Text className="text-2xl font-bold text-red-600 mb-4">App Crashed!</Text>
          <Text className="text-base text-red-800 font-bold mb-2">Error Details:</Text>
          <Text className="text-sm text-gray-800 bg-white p-4 rounded border border-red-200 mb-6">
            {this.state.error?.toString()}
          </Text>
          
          <TouchableOpacity 
            className="bg-red-600 px-6 py-3 rounded-lg"
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text className="text-white font-bold text-lg">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
