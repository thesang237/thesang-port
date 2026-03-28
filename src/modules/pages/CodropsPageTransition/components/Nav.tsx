import NavLink from './NavLink';

export default function Nav() {
    return (
        <nav className="nav">
            <div className="overflow">
                <NavLink href="/codrops-page-transition">Home</NavLink>
            </div>
            <div className="overflow">
                <NavLink href="/codrops-page-transition/alternative-page">Alternative page</NavLink>
            </div>
        </nav>
    );
}
