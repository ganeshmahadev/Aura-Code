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
}

const CodeViewer: React.FC<CodeViewerProps> = ({ files, className }) => {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const codeRef = useRef<HTMLElement>(null);

  // Initialize with first file if available
  useEffect(() => {
    if (!selectedFile && Object.keys(files).length > 0) {
      setSelectedFile(Object.keys(files)[0]);
    }
  }, [files, selectedFile]);

  // Simple code display without syntax highlighting for now
  useEffect(() => {
    // Code content will be displayed as plain text initially
    console.log("CodeViewer received files:", Object.keys(files));
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
      <EmptyState className={className}>
        <p>No code files available</p>
      </EmptyState>
    );
  }

  return (
    <CodeViewerContainer className={className}>
      <FileTreePanel>
        <FileTreeHeader>Files</FileTreeHeader>
        <FileTree>
          {renderFileTree(organizedFiles)}
        </FileTree>
      </FileTreePanel>
      
      <CodePanel>
        {selectedFile && (
          <>
            <CodeHeader>
              <FileName>{selectedFile}</FileName>
            </CodeHeader>
            <CodeContent>
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

const CodeViewerContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
`;

const FileTreePanel = styled.div`
  width: 250px;
  border-right: 1px solid #3e3e3e;
  display: flex;
  flex-direction: column;
`;

const FileTreeHeader = styled.div`
  padding: 12px 16px;
  background: #252526;
  border-bottom: 1px solid #3e3e3e;
  font-weight: 500;
  font-size: 14px;
`;

const FileTree = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

const FileItem = styled.div<{ depth: number; isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  padding-left: ${({ depth }) => 16 + depth * 20}px;
  cursor: pointer;
  font-size: 14px;
  background: ${({ isSelected }) => isSelected ? '#094771' : 'transparent'};
  color: ${({ isSelected }) => isSelected ? '#ffffff' : '#cccccc'};
  
  &:hover {
    background: ${({ isSelected }) => isSelected ? '#094771' : '#2a2d2e'};
  }
`;

const FolderItem = styled.div<{ depth: number }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  padding-left: ${({ depth }) => 16 + depth * 20}px;
  cursor: pointer;
  font-size: 14px;
  color: #cccccc;
  
  &:hover {
    background: #2a2d2e;
  }
`;

const CodePanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CodeHeader = styled.div`
  padding: 12px 16px;
  background: #252526;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  align-items: center;
`;

const FileName = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const CodeContent = styled.div`
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

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #1e1e1e;
  color: #888;
  font-size: 16px;
`;