import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ChevronDown, ChevronRight, FileIcon, FolderIcon } from "lucide-react";

interface CodeFile {
  path: string;
  content: string;
}

interface CodeViewerProps {
  files: Record<string, string>;
  className?: string;
  isDark?: boolean;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ files, className, isDark = true }) => {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const codeRef = useRef<HTMLElement>(null);

  // Debug files prop changes
  console.log("📁 CodeViewer - files prop received:", {
    fileCount: Object.keys(files).length,
    fileNames: Object.keys(files).slice(0, 5), // Show first 5 files
    hasFiles: Object.keys(files).length > 0
  });

  // Initialize with first file if available
  useEffect(() => {
    if (!selectedFile && Object.keys(files).length > 0) {
      const firstFile = Object.keys(files)[0];
      console.log("📁 CodeViewer - Setting first file as selected:", firstFile);
      setSelectedFile(firstFile);
    }
  }, [files, selectedFile]);

  // Simple code display without syntax highlighting for now
  useEffect(() => {
    // Code content will be displayed as plain text initially
    console.log("📁 CodeViewer - Files changed, current files:", Object.keys(files));
    console.log("📁 CodeViewer - Selected file:", selectedFile);
  }, [selectedFile, files]);

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
        return 'tsx';
      case 'ts':
        return 'typescript';
      case 'jsx':
        return 'jsx';
      case 'js':
        return 'javascript';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      default:
        return 'javascript';
    }
  };

  const getFileIcon = (filename: string) => {
    return <FileIcon size={16} />;
  };

  const organizeFiles = (files: Record<string, string>) => {
    const organized: any = {};
    
    Object.keys(files).forEach(filePath => {
      const parts = filePath.split('/');
      let current = organized;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // This is a file
          current[part] = { type: 'file', content: files[filePath], fullPath: filePath };
        } else {
          // This is a directory
          if (!current[part]) {
            current[part] = { type: 'directory', children: {} };
          }
          current = current[part].children;
        }
      });
    });
    
    return organized;
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (node: any, path: string = "", depth: number = 0): React.ReactNode => {
    return Object.keys(node).map(key => {
      const item = node[key];
      const currentPath = path ? `${path}/${key}` : key;
      
      if (item.type === 'file') {
        return (
          <FileItem
            key={currentPath}
            depth={depth}
            isSelected={selectedFile === item.fullPath}
            onClick={() => setSelectedFile(item.fullPath)}
            isDark={isDark}
          >
            {getFileIcon(key)}
            <span>{key}</span>
          </FileItem>
        );
      } else {
        const isExpanded = expandedFolders.has(currentPath);
        return (
          <div key={currentPath}>
            <FolderItem
              depth={depth}
              onClick={() => toggleFolder(currentPath)}
              isDark={isDark}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <FolderIcon size={16} />
              <span>{key}</span>
            </FolderItem>
            {isExpanded && (
              <div>
                {renderFileTree(item.children, currentPath, depth + 1)}
              </div>
            )}
          </div>
        );
      }
    });
  };

  const organizedFiles = organizeFiles(files);
  const currentFileContent = selectedFile ? files[selectedFile] || "" : "";
  const language = selectedFile ? getLanguage(selectedFile) : "javascript";

  if (Object.keys(files).length === 0) {
    return (
      <EmptyState className={className} isDark={isDark}>
        <p>No code files available</p>
      </EmptyState>
    );
  }

  return (
    <CodeViewerContainer className={className} isDark={isDark}>
      <FileTreePanel isDark={isDark}>
        <FileTreeHeader isDark={isDark}>Files</FileTreeHeader>
        <FileTree isDark={isDark}>
          {renderFileTree(organizedFiles)}
        </FileTree>
      </FileTreePanel>
      
      <CodePanel isDark={isDark}>
        {selectedFile && (
          <>
            <CodeHeader isDark={isDark}>
              <FileName isDark={isDark}>{selectedFile}</FileName>
            </CodeHeader>
            <CodeContent isDark={isDark}>
              <pre>
                <code ref={codeRef}>
                  {currentFileContent}
                </code>
              </pre>
            </CodeContent>
          </>
        )}
      </CodePanel>
    </CodeViewerContainer>
  );
};

export default CodeViewer;

const CodeViewerContainer = styled.div<{ isDark: boolean }>`
  display: flex;
  width: 100%;
  height: 100%;
  background: ${({ isDark }) => isDark ? '#1e1e1e' : '#f0f0f0'};
  color: ${({ isDark }) => isDark ? '#d4d4d4' : '#333'};
`;

const FileTreePanel = styled.div<{ isDark: boolean }>`
  width: 250px;
  border-right: 1px solid ${({ isDark }) => isDark ? '#3e3e3e' : '#ccc'};
  display: flex;
  flex-direction: column;
  background: ${({ isDark }) => isDark ? '#252526' : '#f5f5f5'};
`;

const FileTreeHeader = styled.div<{ isDark: boolean }>`
  padding: 12px 16px;
  background: ${({ isDark }) => isDark ? '#252526' : '#e0e0e0'};
  border-bottom: 1px solid ${({ isDark }) => isDark ? '#3e3e3e' : '#ccc'};
  font-weight: 500;
  font-size: 14px;
  color: ${({ isDark }) => isDark ? '#d4d4d4' : '#333'};
`;

const FileTree = styled.div<{ isDark: boolean }>`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  background: ${({ isDark }) => isDark ? '#252526' : '#f5f5f5'};
`;

const FileItem = styled.div<{ depth: number; isSelected: boolean; isDark?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  padding-left: ${({ depth }) => 16 + depth * 20}px;
  cursor: pointer;
  font-size: 14px;
  background: ${({ isSelected, isDark }) => 
    isSelected 
      ? (isDark ? '#094771' : '#e3f2fd')
      : 'transparent'
  };
  color: ${({ isSelected, isDark }) => 
    isSelected 
      ? (isDark ? '#ffffff' : '#1976d2')
      : (isDark ? '#cccccc' : '#666666')
  };
  
  &:hover {
    background: ${({ isSelected, isDark }) => 
      isSelected 
        ? (isDark ? '#094771' : '#e3f2fd')
        : (isDark ? '#2a2d2e' : '#f0f0f0')
    };
  }
`;

const FolderItem = styled.div<{ depth: number; isDark?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  padding-left: ${({ depth }) => 16 + depth * 20}px;
  cursor: pointer;
  font-size: 14px;
  color: ${({ isDark }) => isDark ? '#cccccc' : '#666666'};
  
  &:hover {
    background: ${({ isDark }) => isDark ? '#2a2d2e' : '#f0f0f0'};
  }
`;

const CodePanel = styled.div<{ isDark: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ isDark }) => isDark ? '#1e1e1e' : '#f0f0f0'};
`;

const CodeHeader = styled.div<{ isDark: boolean }>`
  padding: 12px 16px;
  background: ${({ isDark }) => isDark ? '#252526' : '#e0e0e0'};
  border-bottom: 1px solid ${({ isDark }) => isDark ? '#3e3e3e' : '#ccc'};
  display: flex;
  align-items: center;
  color: ${({ isDark }) => isDark ? '#d4d4d4' : '#333'};
`;

const FileName = styled.span<{ isDark: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ isDark }) => isDark ? '#d4d4d4' : '#333'};
`;

const CodeContent = styled.div<{ isDark: boolean }>`
  flex: 1;
  overflow: auto;
  
  pre {
    margin: 0;
    padding: 16px;
    background: transparent;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    
    code {
      background: transparent;
      padding: 0;
      border-radius: 0;
      font-family: inherit;
    }
  }
`;

const EmptyState = styled.div<{ isDark?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: ${({ isDark }) => isDark ? '#1e1e1e' : '#f0f0f0'};
  color: ${({ isDark }) => isDark ? '#888' : '#666'};
  font-size: 16px;
`;