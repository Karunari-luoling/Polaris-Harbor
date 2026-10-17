import React from 'react';
import { Project } from '../types';
import { ArrowUpRight } from 'lucide-react';
import { RepoPlatformIcon, getRepoPlatformLabel } from './RepoPlatformIcon';
import { useCopy } from '../context/CopyContext';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { projects: copy } = useCopy();

  return (
    <article className="group card-surface card-lift flex h-full flex-col p-4 md:p-5">
      <div className="relative z-10 aspect-[16/10] w-full overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--bg-1)]">
        <img
          src={project.imageUrl}
          alt={project.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04080f]/55 via-transparent to-transparent opacity-70" />
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/80 backdrop-blur-md">
            <span className="h-1 w-1 rounded-full bg-[var(--lamp)] shadow-[0_0_8px_var(--lamp)]" />
            Project
          </span>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/10" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-2 pb-1 pt-6 md:px-3">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="font-display text-[1.65rem] font-semibold leading-tight tracking-wide text-ink transition-colors duration-300 group-hover:text-lamp">
            {project.title}
          </h3>
          <ArrowUpRight
            size={18}
            className="mt-1.5 shrink-0 text-faint transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lamp"
          />
        </div>

        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-muted">{project.description}</p>

        <div className="mb-6 mt-auto flex flex-wrap gap-2">
          {project.tags.map(tag => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>

        <div
          className={`grid gap-3 border-t border-[var(--line)] pt-5 ${
            project.repo ? 'grid-cols-[1fr_auto]' : 'grid-cols-1'
          }`}
        >
          <a href={project.link} target="_blank" rel="noreferrer" className="btn-lamp min-h-[46px]">
            {copy.action} <ArrowUpRight size={15} />
          </a>

          {/* 若提供仓库地址则展示开源平台入口（根据链接自适应图标） */}
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              className="flex w-12 items-center justify-center rounded-full border border-[var(--line-strong)] text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--lamp)] hover:text-lamp"
              aria-label={`View Source on ${getRepoPlatformLabel(project.repo)}`}
            >
              <RepoPlatformIcon url={project.repo} size={19} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
