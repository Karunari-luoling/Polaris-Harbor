import React from 'react';
import { Project } from '../types';
import { ArrowUpRight } from 'lucide-react';
import { RepoPlatformIcon, getRepoPlatformLabel } from './RepoPlatformIcon';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-900/30 hover:border-blue-500/30 dark:hover:border-blue-400/30 h-full overflow-hidden">

      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 mb-5 border border-slate-100 dark:border-slate-800">
        <img 
          src={project.imageUrl} 
          alt={project.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-xl pointer-events-none" />
      </div>

      <div className="relative z-10 flex-1 px-2 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {project.title}
          </h3>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6 mt-auto">
          {project.tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600 transition-colors">
              {tag}
            </span>
          ))}
        </div>

        <div
          className={`grid gap-3 mt-auto pt-5 border-t border-slate-50 dark:border-slate-800 ${
            project.repo ? 'grid-cols-[1fr_auto]' : 'grid-cols-1'
          }`}
        >
          <a 
            href={project.link} 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-blue-600 dark:hover:bg-white dark:hover:text-blue-600 active:scale-95 shadow-lg shadow-slate-900/10 dark:shadow-black/20 hover:shadow-blue-600/20"
          >
            View Project <ArrowUpRight size={16} />
          </a>
          
          {/* 若提供仓库地址则展示开源平台入口（根据链接自适应图标） */}
          {project.repo && (
            <a 
              href={project.repo} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-center w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:border-slate-900 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:shadow-md"
              aria-label={`View Source on ${getRepoPlatformLabel(project.repo)}`}
            >
              <RepoPlatformIcon url={project.repo} size={20} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
