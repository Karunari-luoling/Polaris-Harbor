import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useCopy } from '../context/CopyContext';

export interface ListFacet {
  /** 承载该分面的地址栏参数名 */
  param: string;
  /** 由数据自身统计得到的候选值，按出现次数从多到少排列 */
  values: { value: string; count: number }[];
}

export interface ListQuery {
  search: string;
  page: number;
  filtered: boolean;
  facetOf: (param: string) => string;
  setSearch: (value: string) => void;
  setFacet: (param: string, value: string) => void;
  setPage: (value: number) => void;
  clear: () => void;
}

// 占位符按名替换，模板里写了未知的花括号时原样留着，好让人一眼看出是配置写错了
const fill = (template: string, tokens: Record<string, number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in tokens ? String(tokens[key]) : match));

export const useListQuery = (facetParams: string[]): ListQuery => {
  const [params, setParams] = useSearchParams();

  const write = useCallback(
    (mutate: (next: URLSearchParams) => void, replace: boolean) => {
      setParams(prev => {
        const next = new URLSearchParams(prev);
        mutate(next);
        return next;
      }, { replace });
    },
    [setParams]
  );

  const search = params.get('q') ?? '';
  const parsed = Number.parseInt(params.get('page') ?? '', 10);

  return {
    search,
    page: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
    filtered: search !== '' || facetParams.some(param => !!params.get(param)),
    facetOf: param => params.get(param) ?? '',
    // 逐键写入不能各留一条历史记录，否则后退键会被搜索框吃光
    setSearch: value =>
      write(next => {
        if (value) next.set('q', value);
        else next.delete('q');
        // 条件一变结果集就变了，旧页码可能指向已经不存在的页
        next.delete('page');
      }, true),
    setFacet: (param, value) =>
      write(next => {
        if (value) next.set(param, value);
        else next.delete(param);
        next.delete('page');
      }, false),
    setPage: value =>
      write(next => {
        if (value > 1) next.set('page', String(value));
        else next.delete('page');
      }, false),
    clear: () =>
      write(next => {
        next.delete('q');
        next.delete('page');
        facetParams.forEach(param => next.delete(param));
      }, true),
  };
};

interface ListToolbarProps {
  facets: ListFacet[];
  query: ListQuery;
  matched: number;
  total: number;
}

interface SearchFieldProps {
  value: string;
  placeholder: string;
  clearLabel: string;
  onChange: (value: string) => void;
}

const SearchField: React.FC<SearchFieldProps> = ({ value, placeholder, clearLabel, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const [hasText, setHasText] = useState(!!value);

  // 输入框刻意不做成受控：组字期间 React 一回写 input.value，浏览器的输入法缓冲就被
  // 打断，拼音字母会被反复插进去。只在地址栏从别处变化时（清空筛选、前进后退）补一次。
  useEffect(() => {
    const input = inputRef.current;
    if (input && input.value !== value) {
      input.value = value;
      setHasText(!!value);
    }
  }, [value]);

  const commit = (next: string) => {
    setHasText(!!next);
    if (!composing.current) onChange(next);
  };

  return (
    <label className="filter-search md:w-80">
      <Search size={14} />
      <input
        aria-label={placeholder}
        defaultValue={value}
        onChange={event => commit(event.target.value)}
        onCompositionEnd={event => {
          composing.current = false;
          onChange(event.currentTarget.value);
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        placeholder={placeholder}
        ref={inputRef}
        type="search"
      />
      {hasText && (
        <button
          aria-label={clearLabel}
          className="text-faint transition-colors duration-300 hover:text-lamp"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = '';
            commit('');
          }}
          type="button"
        >
          <X size={13} />
        </button>
      )}
    </label>
  );
};

export const ListToolbar: React.FC<ListToolbarProps> = ({ facets, query, matched, total }) => {
  const { filters: copy } = useCopy();
  // 只剩一个候选值的分面不配占一行：它除了「全部 / 那一个」没有别的可挑
  const groups = facets.filter(facet => facet.values.length > 1);

  // 空列表上没有可筛的东西，工具条只会变成一行「显示 0 / 共 0」的噪音
  if (total === 0) return null;

  return (
    <div className="mb-9 flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SearchField
          clearLabel={copy.clear}
          onChange={query.setSearch}
          placeholder={copy.search}
          value={query.search}
        />

        <div className="flex items-center gap-4">
          {query.filtered && (
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
              {fill(copy.showing, { n: matched, total })}
            </span>
          )}
          {query.filtered && (
            <button type="button" onClick={query.clear} className="btn-ghost">
              {copy.clear}
            </button>
          )}
        </div>
      </div>

      {groups.map(facet => (
        <FacetRow key={facet.param} facet={facet} query={query} />
      ))}
    </div>
  );
};

// 真实博客的分类动辄二三十个，全铺会把筛选区挤成一片墙，按频次取前若干个再折叠
const MAX_VISIBLE_CHIPS = 8;

interface FacetRowProps {
  facet: ListFacet;
  query: ListQuery;
}

const FacetRow: React.FC<FacetRowProps> = ({ facet, query }) => {
  const { filters: copy } = useCopy();
  const [expanded, setExpanded] = useState(false);
  const current = query.facetOf(facet.param);

  const head = facet.values.slice(0, MAX_VISIBLE_CHIPS);
  const rest = facet.values.slice(MAX_VISIBLE_CHIPS);
  // 折叠时也要让地址里选中的值露面，否则分享出去的链接看不出自己选的是哪一个
  const pinned = rest.find(item => item.value === current);
  const shown = expanded ? facet.values : pinned ? [...head, pinned] : head;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="chip-toggle" aria-pressed={current === ''} onClick={() => query.setFacet(facet.param, '')}>
        {copy.all}
      </button>
      {shown.map(({ value }) => (
        <button
          key={value}
          type="button"
          className="chip-toggle"
          aria-pressed={current === value}
          // 再点一次已选中的标签等于取消这一维筛选
          onClick={() => query.setFacet(facet.param, current === value ? '' : value)}
        >
          {value}
        </button>
      ))}
      {rest.length > 0 && (
        <button type="button" className="chip-toggle" aria-expanded={expanded} onClick={() => setExpanded(open => !open)}>
          {expanded ? copy.less : fill(copy.more, { n: rest.length })}
        </button>
      )}
    </div>
  );
};

interface ListPagerProps {
  query: ListQuery;
  page: number;
  pageCount: number;
}

export const ListPager: React.FC<ListPagerProps> = ({ query, page, pageCount }) => {
  const { filters: copy } = useCopy();

  if (pageCount <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-5">
      <button
        type="button"
        className="btn-ghost disabled:pointer-events-none disabled:opacity-35"
        onClick={() => query.setPage(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft size={13} /> {copy.prev}
      </button>
      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-faint">
        {fill(copy.pageLabel, { page, pages: pageCount })}
      </span>
      <button
        type="button"
        className="btn-ghost disabled:pointer-events-none disabled:opacity-35"
        onClick={() => query.setPage(page + 1)}
        disabled={page >= pageCount}
      >
        {copy.next} <ChevronRight size={13} />
      </button>
    </div>
  );
};
