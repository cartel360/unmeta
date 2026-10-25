'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X, ArrowUpRight } from 'lucide-react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { site } from '@/config/site';
export function Navigation() {
  const [light, setLight] = useState(false),
    [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  }, [light]);
  return (
    <header className="header">
      <div className="nav-wrap">
        <Brand />
        <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <Link href="/#tool" onClick={() => setOpen(false)}>
            The tool
          </Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/#faq" onClick={() => setOpen(false)}>
            FAQ
          </Link>
          {site.github && (
            <a href={site.github} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight size={13} />
            </a>
          )}
        </nav>
        <div className="nav-actions">
          <span className="nav-note">Less data. More privacy.</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLight(!light)}
            aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
          <Button
            className="mobile-menu"
            variant="ghost"
            size="icon"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>
    </header>
  );
}
