import styled from 'styled-components';
import { useAuth } from '@/context/AuthContext';

type HeaderProps = {
  toggleSidebar: () => void;
};

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  margin-bottom: 2rem;
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const UserEmail = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LogoutButton = styled.button`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.text.light};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <HeaderContainer>
      <MenuButton onClick={toggleSidebar} aria-label="Toggle menu">
        ≡
      </MenuButton>
      
      <UserSection>
        <UserInfo>
          <UserName>{user?.name || 'User'}</UserName>
          <UserEmail>{user?.email || 'user@example.com'}</UserEmail>
        </UserInfo>
        <LogoutButton onClick={logout}>Logout</LogoutButton>
      </UserSection>
    </HeaderContainer>
  );
}