import { duplicates } from '@docusaurus/theme-common';
import clsx from 'clsx';
import React, {
  cloneElement,
  createRef,
  isValidElement,
  ReactElement,
  useEffect,
  useState,
} from 'react';
import { useScrollPositionBlocker } from './scrollUtils';
import styles from './styles.module.css';

// A very rough duck type, but good enough to guard against mistakes while
// allowing customization
function isTabItem(
  comp: ReactElement
): comp is ReactElement<any & { icon?: JSX.Element }> {
  return typeof comp.props.value !== 'undefined';
}

function TabsComponent(props: any): JSX.Element {
  const {
    lazy,
    block,
    defaultValue: defaultValueProp,
    values: valuesProp,
    className,
  } = props;
  const [leftNavVisible, setLeftNavVisible] = useState(false);
  const [rightNavVisible, setRightNavVisible] = useState(false);
  const tabsNavEl = createRef<HTMLUListElement>();
  const children = React.Children.map(props.children, (child) => {
    if (isValidElement(child) && isTabItem(child)) {
      return child;
    }
    // child.type.name will give non-sensical values in prod because of
    // minification, but we assume it won't throw in prod.
    throw new Error(
      `Docusaurus error: Bad <Tabs> child <${
        typeof child.type === 'string' ? child.type : child.type.name
      }>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`
    );
  });
  const values =
    valuesProp ??
    // Only pick keys that we recognize. MDX would inject some keys by default
    children.map(({ props: { value, label, icon, attributes } }: any) => ({
      value,
      label,
      attributes,
      icon,
    }));
  const dup = duplicates(values, (a: any, b: any) => a.value === b.value);
  if (dup.length > 0) {
    throw new Error(
      `Docusaurus error: Duplicate values "${dup
        .map((a: any) => a.value)
        .join(', ')}" found in <Tabs>. Every value needs to be unique.`
    );
  }
  // When defaultValueProp is null, don't show a default tab
  const defaultValue =
    defaultValueProp === null
      ? defaultValueProp
      : defaultValueProp ??
        children.find((child: any) => child.props.default)?.props.value ??
        children[0]?.props.value;
  if (
    defaultValue !== null &&
    !values.some((a: any) => a.value === defaultValue)
  ) {
    throw new Error(
      `Docusaurus error: The <Tabs> has a defaultValue "${defaultValue}" but none of its children has the corresponding value. Available values are: ${values
        .map((a: any) => a.value)
        .join(
          ', '
        )}. If you intend to show no default tab, use defaultValue={null} instead.`
    );
  }

  // const { tabGroupChoices, setTabGroupChoices } = useTabGroupChoice();
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const tabRefs: (HTMLLIElement | null)[] = [];
  const { blockElementScrollPositionUntilNextRender } =
    useScrollPositionBlocker();

  const handleTabChange = (
    event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>
  ) => {
    const newTab = event.currentTarget;
    const newTabIndex = tabRefs.indexOf(newTab);
    const newTabValue = values[newTabIndex]!.value;

    if (newTabValue !== selectedValue) {
      blockElementScrollPositionUntilNextRender(newTab);
      setSelectedValue(newTabValue);
    }
  };

  const handleKeydown = (event: React.KeyboardEvent<HTMLLIElement>) => {
    let focusElement: HTMLLIElement | null = null;

    switch (event.key) {
      case 'ArrowRight': {
        const nextTab = tabRefs.indexOf(event.currentTarget) + 1;
        focusElement = tabRefs[nextTab] || tabRefs[0]!;
        break;
      }
      case 'ArrowLeft': {
        const prevTab = tabRefs.indexOf(event.currentTarget) - 1;
        focusElement = tabRefs[prevTab] || tabRefs[tabRefs.length - 1]!;
        break;
      }
      default:
        break;
    }

    focusElement?.focus();
  };

  useEffect(() => {
    if (tabsNavEl.current) {
      setLeftNavVisible(tabsNavEl.current.scrollLeft > 40);
      setRightNavVisible(
        tabsNavEl.current.scrollWidth > tabsNavEl.current.offsetWidth
      );
    }
  }, [tabsNavEl]);

  return (
    <div className={clsx('tabs-container', styles.tabList)}>
      <div className={clsx('tabs-nav', styles.tabNav)}>
        <ul
          ref={tabsNavEl}
          role="tablist"
          aria-orientation="horizontal"
          className={clsx(
            'tabs',
            {
              'tabs--block': block,
            },
            className
          )}
          onScroll={() => {
            if (tabsNavEl.current) {
              setLeftNavVisible(tabsNavEl.current.scrollLeft > 40);
              setRightNavVisible(
                tabsNavEl.current.scrollWidth > tabsNavEl.current.offsetWidth
              );
            }
          }}
        >
          {leftNavVisible && (
            <div
              className={clsx(
                'tabs__nav-item',
                styles.tabNavItem,
                styles.tabNavItemLeft
              )}
            >
              <button
                className={clsx('tabs__nav-button', styles.tabNavButton)}
                onClick={() => {
                  if (tabsNavEl.current) {
                    tabsNavEl.current.scrollTo({
                      left: tabsNavEl.current.scrollLeft - 150,
                      behavior: 'smooth',
                    });
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 512 512"
                >
                  <polyline
                    points="328 112 184 256 328 400"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="48px"
                  />
                </svg>
              </button>
            </div>
          )}
          {values.map(({ value, label, icon, attributes }: any) => (
            <li
              role="tab"
              tabIndex={selectedValue === value ? 0 : -1}
              aria-selected={selectedValue === value}
              key={value}
              ref={(tabControl) => tabRefs.push(tabControl)}
              onKeyDown={handleKeydown}
              onFocus={handleTabChange}
              onClick={handleTabChange}
              {...attributes}
              className={clsx(
                'tabs__item',
                styles.tabItem,
                attributes?.className as string,
                {
                  'tabs__item--active': selectedValue === value,
                }
              )}
            >
              {/* Ionic extended portion to add icon support to tab items */}
              {icon && (
                <span className={clsx('tabs__icon', styles.tabIcon)}>
                  {icon}
                </span>
              )}
              {label ?? value}
            </li>
          ))}
          {rightNavVisible && (
            <div className={clsx('tabs__nav-item', styles.tabNavItem)}>
              <button
                className={clsx('tabs__nav-button', styles.tabNavButton)}
                onClick={() => {
                  tabsNavEl.current?.scrollTo({
                    left: tabsNavEl.current.scrollLeft + 150,
                    behavior: 'smooth',
                  });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 512 512"
                >
                  <polyline
                    points="184 112 328 256 184 400"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="48px"
                  />
                </svg>
              </button>
            </div>
          )}
        </ul>
      </div>

      {lazy ? (
        cloneElement(
          children.filter(
            (tabItem: any) => tabItem.props.value === selectedValue
          )[0]!,
          {
            className: 'margin-top--md',
          }
        )
      ) : (
        <div>
          {children.map((tabItem: any, i: number) =>
            cloneElement(tabItem, {
              key: i,
              className: `${tabItem.props.className} ${
                tabItem.props.value !== selectedValue ? 'hidden' : ''
              }`,
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function Tabs(props: any): JSX.Element {
  return (
    <TabsComponent
      // Remount tabs after hydration
      // Temporary fix for https://github.com/facebook/docusaurus/issues/5653
      key={String(true)}
      {...props}
    />
  );
}
