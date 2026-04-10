import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/utils";

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const [file, setFile] = useState<File | null>(null);

    const maxFileSize = 20 * 1024 * 1024; // 20 MB

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const selectedFile = acceptedFiles[0] || null;
            setFile(selectedFile);          // ✅ update state
            onFileSelect?.(selectedFile);  // ✅ notify parent
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { "application/pdf": [".pdf"] },
        maxSize: maxFileSize,
    });

    const removeFile = () => {
        setFile(null);
        onFileSelect?.(null);
    };

    return (
        <div className="w-full gradient-border">
            <div {...getRootProps()} className="cursor-pointer p-4 border-dashed border-2 border-gray-300 rounded-md">
                <input {...getInputProps()} />

                {file ? (
                    <div className="uploader-selected-file flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <img src="/images/pdf.png" alt="pdf" className="w-10 h-10" />
                            <div>
                                <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                    {file.name}
                                </p>
                                <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                            </div>
                        </div>
                        <button type="button" onClick={removeFile} className="p-2">
                            <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                            <img src="/icons/info.svg" alt="upload" className="w-16 h-16" />
                        </div>
                        <p className="text-lg text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">PDF (max {formatSize(maxFileSize)})</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploader;