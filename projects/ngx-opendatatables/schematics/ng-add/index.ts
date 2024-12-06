import {
    Rule,
    Tree,
    SchematicsException,
} from '@angular-devkit/schematics';
import {virtualFs, workspaces} from '@angular-devkit/core';

import {Schema} from './schema';

function createHost(tree: Tree): workspaces.WorkspaceHost {
    return {
        async readFile(path: string): Promise<string> {
            const data = tree.read(path);
            if (!data) {
                throw new SchematicsException('File not found.');
            }
            return virtualFs.fileBufferToString(data);
        },
        async writeFile(path: string, data: string): Promise<void> {
            return tree.overwrite(path, data);
        },
        async isDirectory(path: string): Promise<boolean> {
            return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
        },
        async isFile(path: string): Promise<boolean> {
            return tree.exists(path);
        },
    };
}

export function ngAdd(options: Schema): Rule {
    return async (tree: Tree) => {
        const host = createHost(tree);
        const {workspace} = await workspaces.readWorkspace('/', host);

        const project = options.project != null ? workspace.projects.get(options.project) : null;
        if (!project) {
            throw new SchematicsException(`Invalid project name: ${options.project}`);
        }

        ['build', 'test'].forEach(target => {
            const projectTarget = project.targets.get(target);
            if (projectTarget) {
                const options = projectTarget.options as workspaces.TargetDefinition['options'];
                const styles = options!['styles'] as string[] || [];
                
                const cssPath = 'node_modules/datatables.net-dt/css/dataTables.dataTables.min.css';
                if (!styles.includes(cssPath)) {
                    styles.push(cssPath);
                    projectTarget.options!['styles'] = styles;
                }
            }
        });

        // Écrire les modifications dans angular.json
        const workspacePath = '/angular.json';
        const workspaceContent = JSON.parse(tree.readText(workspacePath));
        
        workspaceContent.projects[options.project].architect.build.options.styles = 
            project.targets.get('build')?.options!['styles'];
        workspaceContent.projects[options.project].architect.test.options.styles = 
            project.targets.get('test')?.options!['styles'];

        tree.overwrite(workspacePath, JSON.stringify(workspaceContent, null, 2));
    };
}