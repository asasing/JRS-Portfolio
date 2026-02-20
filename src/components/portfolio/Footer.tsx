export default function Footer() {
  return (
    <footer className="py-8 border-t border-border-subtle">
      <div className="site-container flex items-center justify-center text-center">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} John Roldan Sasing. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
