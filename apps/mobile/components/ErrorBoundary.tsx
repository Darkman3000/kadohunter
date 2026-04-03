import React, { Component, type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { KadoColors } from "@/constants/theme";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={{ flex: 1, backgroundColor: KadoColors.midnight, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ alignItems: "center", padding: 32, borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(17,34,64,0.6)" }}>
            <Text style={{ color: KadoColors.lightSlate, fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
              Something went wrong
            </Text>
            <Text style={{ color: KadoColors.slateText, fontSize: 12, textAlign: "center", marginBottom: 20 }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </Text>
            <Pressable
              onPress={this.handleReset}
              style={{ backgroundColor: KadoColors.umber, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}
            >
              <Text style={{ color: KadoColors.midnight, fontWeight: "bold", fontSize: 14 }}>
                Try Again
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
