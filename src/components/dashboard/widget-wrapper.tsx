"use client";

import { GripVertical, X, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  isEditing?: boolean;
  onRemove?: () => void;
}

export function WidgetWrapper({
  title,
  children,
  isEditing,
  onRemove,
}: WidgetWrapperProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0 px-4 py-3">
        <div className="flex items-center gap-2">
          {isEditing && (
            <GripVertical className="drag-handle h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          )}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        {isEditing && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto px-4 pb-4 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
