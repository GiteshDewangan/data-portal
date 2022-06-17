import { useState } from 'react';
import PropTypes from 'prop-types';
import { TopBarButton } from './TopBarItems';
import './TopBarMenu.css';

/**
 * @param {Object} props
 * @param {string} props.buttonIcon
 * @param {React.ReactNode[]} props.children
 */
function TopBarMenu({ buttonIcon, children }) {
  const [showMenu, setShowMenu] = useState(false);
  function handleMenuBlur(e) {
    if (showMenu && !e.currentTarget.contains(e.relatedTarget))
      setShowMenu(false);
  }
  function toggleMenu() {
    setShowMenu((s) => !s);
  }
  return (
    <span className='top-bar-menu' onBlur={handleMenuBlur}>
      <TopBarButton
        isActive={showMenu}
        icon={buttonIcon}
        onClick={toggleMenu}
      />
      {showMenu && <ul className='top-bar-menu__items'>{children}</ul>}
    </span>
  );
}

TopBarMenu.propTypes = {
  buttonIcon: PropTypes.string.isRequired,
  children: PropTypes.arrayOf(PropTypes.node),
};

/** @param {{ children: React.ReactNode }} */
function Item({ children }) {
  return <li className='top-bar-menu__item'>{children}</li>;
}

Item.propTypes = {
  children: PropTypes.node,
};

TopBarMenu.Item = Item;
export default TopBarMenu;
