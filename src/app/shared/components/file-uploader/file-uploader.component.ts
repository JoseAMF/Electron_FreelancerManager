import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { AttachmentService } from '../../../core/services';
import { Attachment } from '../../../../../app/backend/entities';

export interface FileItem {
  id?: number;
  name: string;
  size: number;
  type?: string;
  file?: File;
  attachment?: Attachment;
  isUploaded?: boolean;
}

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule, FileUploadModule, ButtonModule, TooltipModule, ConfirmDialog],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss',
  providers: [ConfirmationService]
})
export class FileUploaderComponent implements OnInit, OnDestroy, OnChanges {
  @Input() readonly: boolean = false;
  @Input() multiple: boolean = true;
  @Input() accept: string = '.pdf,.doc,.docx,.txt,.jpg,.png,.jpeg';
  @Input() maxFileSize: number = 10000000; // 10MB
  @Input() jobId?: number;
  @Input() initialFiles: Attachment[] = [];
  
  @Output() filesChanged = new EventEmitter<FileItem[]>();
  @Output() fileRemoved = new EventEmitter<FileItem>();
  @Output() fileAdded = new EventEmitter<FileItem>();

  files: FileItem[] = [];
  imagePreviewUrls: { [fileName: string]: string } = {};

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private attachmentService: AttachmentService
  ) {}

  ngOnInit() {
    this.loadInitialFiles();
  }

  ngOnDestroy() {
    this.cleanupPreviews();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialFiles'] && !changes['initialFiles'].firstChange) {
      this.loadInitialFiles();
    }
  }

  private async loadInitialFiles() {
    this.cleanupPreviews();
    
    if (this.initialFiles.length > 0) {
      this.files = this.initialFiles.map(attachment => ({
        id: attachment.id,
        name: attachment.file_name || 'Unknown file',
        size: 0, // We'll update this when we load the file content
        attachment,
        isUploaded: true
      }));

      // Generate previews for uploaded images and get file sizes
      for (const file of this.files) {
        if (file.attachment?.id) {
          await this.generateUploadedImagePreview(file);
        }
      }
    } else {
      this.files = [];
    }
    
    this.filesChanged.emit(this.files);
  }

  private async generateUploadedImagePreview(fileItem: FileItem) {
    if (!fileItem.attachment?.id) return;
    
    try {
      if (this.isImageFile(fileItem.name)) {
        const fileContent = await this.attachmentService.getFileContent(fileItem.attachment.id);
        if (fileContent) {
          // Update file size
          fileItem.size = fileContent.byteLength;
          
          // Create blob URL for preview
          const blob = new Blob([fileContent], { type: fileItem.type || 'image/*' });
          const url = URL.createObjectURL(blob);
          this.imagePreviewUrls[fileItem.name] = url;
        }
      } else {
        // For non-image files, just get the size
        const fileContent = await this.attachmentService.getFileContent(fileItem.attachment.id);
        if (fileContent) {
          fileItem.size = fileContent.byteLength;
        }
      }
    } catch (error) {
      console.error('Error generating preview for uploaded file:', error);
    }
  }

  onFileSelect(event: any) {
    const selectedFiles = event.files || event.currentFiles;
    
    for (const file of selectedFiles) {
      const fileItem: FileItem = {
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        isUploaded: false
      };
      
      this.files.push(fileItem);
      this.fileAdded.emit(fileItem);
      
      // Generate preview for images
      if (this.isImageFile(file.name)) {
        this.generatePreview(file);
      }
    }
    
    this.filesChanged.emit(this.files);
  }

  onFileRemove(event: any) {
    const removedFile = event.file;
    const index = this.files.findIndex(f => f.file === removedFile);
    if (index > -1) {
      const fileItem = this.files[index];
      this.removeFilePreview(fileItem.name);
      this.files.splice(index, 1);
      this.fileRemoved.emit(fileItem);
      this.filesChanged.emit(this.files);
    }
  }

  onClear() {
    this.cleanupPreviews();
    this.files = this.files.filter(f => f.isUploaded); // Keep uploaded files
    this.filesChanged.emit(this.files);
  }

  removeFile(fileItem: FileItem, event?: Event) {
    // If it's an uploaded file, show confirmation dialog
    if (fileItem.isUploaded) {
      this.confirmationService.confirm({
        target: event?.target as EventTarget,
        message: `Are you sure you want to delete "${fileItem.name}"? This action cannot be undone.`,
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonProps: {
          label: 'Delete',
          severity: 'danger'
        },
        rejectButtonProps: {
          label: 'Cancel',
          severity: 'secondary',
          outlined: true
        },
        accept: () => {
          this.deleteUploadedFile(fileItem);
        }
      });
    } else {
      // For pending files, just remove from UI
      this.removePendingFile(fileItem);
    }
  }

  private async deleteUploadedFile(fileItem: FileItem) {
    if (!fileItem.attachment?.id) return;

    try {
      const deleted = await this.attachmentService.deleteAttachment(fileItem.attachment.id);
      if (deleted) {
        this.removeFileFromUI(fileItem);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'File deleted successfully'
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete file'
        });
      }
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete file from server'
      });
    }
  }

  private removePendingFile(fileItem: FileItem) {
    this.removeFileFromUI(fileItem);
  }

  private removeFileFromUI(fileItem: FileItem) {
    const index = this.files.findIndex(f => f === fileItem);
    if (index > -1) {
      this.removeFilePreview(fileItem.name);
      this.files.splice(index, 1);
      this.fileRemoved.emit(fileItem);
      this.filesChanged.emit(this.files);
    }
  }

  private generatePreview(file: File) {
    if (this.isImageFile(file.name)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrls[file.name] = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private removeFilePreview(fileName: string) {
    if (this.imagePreviewUrls[fileName]) {
      URL.revokeObjectURL(this.imagePreviewUrls[fileName]);
      delete this.imagePreviewUrls[fileName];
    }
  }

  private cleanupPreviews() {
    Object.values(this.imagePreviewUrls).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.imagePreviewUrls = {};
  }

  isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  trackByFileName(index: number, file: FileItem): string {
    return file.name + (file.id || index);
  }

  getPendingFiles(): FileItem[] {
    return this.files.filter(file => !file.isUploaded);
  }
}
