import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Palette } from 'lucide-react';

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header>
            <nav>
                <div className="logo">Pipeline Express</div>
                <ul className="nav-links">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/saved-workflows">Workflows</Link></li>
                    <li><Link to="/builder">Builder</Link></li>
                    <li>
                        <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme" title={`Current theme: ${theme}`}>
                            <Palette size={20} />
                        </button>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Navbar;
