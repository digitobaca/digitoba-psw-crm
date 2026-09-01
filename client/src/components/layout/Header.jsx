import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/study-in-canada', label: 'Study in Canada' },
  { to: '/psw-canada', label: 'PSW Canada' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { openConsultation } = useConsultationModal();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">CD</span>
          <span>
            Canada<span className="text-primary">Digitoba</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium text-gray-700 hover:text-primary transition-colors',
                  isActive && 'text-primary'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button onClick={() => openConsultation()}>Book Your Free Consultation</Button>
        </div>

        <button
          className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {/* animate-ui's Menu icon morphs its own hamburger lines into an X — animate={open} drives that transition. */}
          <Menu animate={open} size={24} />
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t bg-white">
          <nav className="container flex flex-col py-4 gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn('rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50', isActive && 'text-primary bg-accent')
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Button
              className="mt-2"
              onClick={() => {
                setOpen(false);
                openConsultation();
              }}
            >
              Book Your Free Consultation
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
