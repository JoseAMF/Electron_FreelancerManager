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

  getFileIcon(fileName: string): string {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    switch (extension) {
      case '.pdf':
        return 'pi pi-file-pdf';
      case '.doc':
      case '.docx':
        return 'pi pi-file-word';
      case '.xls':
      case '.xlsx':
        return 'pi pi-file-excel';
      case '.ppt':
      case '.pptx':
        return 'pi pi-desktop';
      case '.txt':
        return 'pi pi-file-edit';
      case '.zip':
      case '.rar':
      case '.7z':
        return 'pi pi-folder';
      case '.mp4':
      case '.avi':
      case '.mkv':
      case '.mov':
        return 'pi pi-video';
      case '.mp3':
      case '.wav':
      case '.flac':
        return 'pi pi-volume-up';
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
      case '.bmp':
      case '.webp':
        return 'pi pi-image'; // Fallback for images without preview
      default:
        return 'pi pi-file';
    }
  }

  getFileIconColor(fileName: string): string {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    switch (extension) {
      case '.pdf':
        return '#dc3545'; // Red
      case '.doc':
      case '.docx':
        return '#0d6efd'; // Blue
      case '.xls':
      case '.xlsx':
        return '#198754'; // Green
      case '.ppt':
      case '.pptx':
        return '#fd7e14'; // Orange
      case '.txt':
        return '#6c757d'; // Gray
      case '.zip':
      case '.rar':
      case '.7z':
        return '#ffc107'; // Yellow
      case '.mp4':
      case '.avi':
      case '.mkv':
      case '.mov':
        return '#e83e8c'; // Pink
      case '.mp3':
      case '.wav':
      case '.flac':
        return '#20c997'; // Teal
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
      case '.bmp':
      case '.webp':
        return '#0dcaf0'; // Cyan
      default:
        return '#6c757d'; // Gray
    }
  }

  // Helper method to get preview URL for images
  getImagePreviewUrl(fileItem: FileItem): string | null {
    if (!this.isImageFile(fileItem.name)) {
      return null;
    }
    return this.imagePreviewUrls[fileItem.name] || null;
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

  async openFile(file: FileItem, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!file.isUploaded || !file.attachment?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'File is not uploaded yet or attachment ID is missing'
      });
      return;
    }

    try {
      const result = await this.attachmentService.openFile(file.attachment.id);
      if (!result.success) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'Failed to open file'
        });
      }
    } catch (error) {
      console.error('Error opening file:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to open file'
      });
    }
  }

  async showInFolder(file: FileItem, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!file.isUploaded || !file.attachment?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'File is not uploaded yet or attachment ID is missing'
      });
      return;
    }

    try {
      const result = await this.attachmentService.showInFolder(file.attachment.id);
      if (!result.success) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: result.error || 'Failed to show file in folder'
        });
      }
    } catch (error) {
      console.error('Error showing file in folder:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to show file in folder'
      });
    }
  }
}
