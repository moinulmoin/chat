"use client";

import { UploadedAttachment } from "@/lib/types";
import { File as FileIcon, Loader2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";

interface AttachmentPreviewProps {
  attachment: UploadedAttachment;
  onRemove: () => void;
}

export function AttachmentPreview({ attachment, onRemove }: AttachmentPreviewProps) {
  return (
    <div className="p-4 pt-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <div className="relative w-12 h-12">
              {attachment.status === "uploading" ? (
                <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-md">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : attachment.contentType?.startsWith("image/") ? (
                <Image
                  src={attachment.url!}
                  alt={attachment.name}
                  fill
                  className="rounded-md object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-md flex flex-col items-center justify-center text-xs text-center p-1">
                  <FileIcon className="w-6 h-6 mb-1" />
                  <span className="truncate">{attachment.name}</span>
                </div>
              )}
            </div>
            {attachment.status !== "uploading" && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}