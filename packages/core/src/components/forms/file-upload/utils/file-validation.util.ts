import { FileUploadRejectedFile, FileUploadRejectionReason } from '../file-upload.interfaces'

type FileOptions = {
  accept?: string
  maxFileSize?: number | undefined
  maxBundleSize?: number | undefined
  maxFiles?: number | undefined
}

type ValidateFileArrayReturn = {
  validFiles: File[]
  invalidFiles: FileUploadRejectedFile[]
}

// Mirrors the native `accept` attribute: `.ext` suffix, `type/*` wildcard or exact MIME type
export const isFileAccepted = (file: File, accept: string): boolean => {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
    .some(entry => {
      if (entry.startsWith('.')) return name.endsWith(entry)
      if (entry.endsWith('/*')) return type.startsWith(entry.slice(0, -1))
      return type === entry
    })
}

export const validateFileArray = (state: File[], files: File[], fileOptions: FileOptions): ValidateFileArrayReturn => {
  const validFiles = []
  const newState = [...state]
  const invalidFiles: FileUploadRejectedFile[] = []

  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    if (file) {
      const reasons: FileUploadRejectionReason[] = []

      if (fileOptions.accept && !isFileAccepted(file, fileOptions.accept)) {
        reasons.push('BAD_EXTENSION')
      }

      if (fileOptions.maxFileSize !== undefined && file.size > fileOptions.maxFileSize) {
        reasons.push('FILE_TOO_BIG')
      }

      const stateBundleSize = newState.map(f => f.size).reduce((a, b) => a + b, 0)
      const bundleSize = stateBundleSize + file.size
      if (fileOptions.maxBundleSize !== undefined && bundleSize > fileOptions.maxBundleSize) {
        reasons.push('FILE_SIZE_SUM_TOO_BIG')
      }

      const amountOfFiles = newState.length + 1
      if (fileOptions.maxFiles !== undefined && amountOfFiles > fileOptions.maxFiles) {
        reasons.push('TOO_MANY_FILES')
      }

      const areFilesEqual = (fileA: File, fileB: File) =>
        fileA.size === fileB.size &&
        fileA.name === fileB.name &&
        fileA.type === fileB.type &&
        fileA.lastModified === fileB.lastModified

      const duplicatedFiles = state.filter(f => areFilesEqual(f, file))
      if (duplicatedFiles.length > 0) {
        reasons.push('DUPLICATED_FILE')
      }

      if (reasons.length > 0) {
        invalidFiles.push({ file, reasons })
      } else {
        newState.push(file)
        validFiles.push(file)
      }
    }
  }

  return {
    validFiles: validFiles,
    invalidFiles: invalidFiles,
  }
}
