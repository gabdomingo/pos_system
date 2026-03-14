from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


OUTPUT = Path(__file__).resolve().parent / "Charlie-PC-Test-Cases-Template.xlsx"


def col_letter(index: int) -> str:
    result = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def cell(value, style: int = 0):
    return {"value": value, "style": style}


def xml_text(value: str) -> str:
    return escape(str(value)).replace("\n", "&#10;")


def make_cell_xml(ref: str, spec: dict) -> str:
    value = spec.get("value", "")
    style = spec.get("style")
    style_attr = f' s="{style}"' if style is not None else ""

    if value is None or value == "":
        return f'<c r="{ref}"{style_attr}/>'

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'<c r="{ref}"{style_attr}><v>{value}</v></c>'

    if isinstance(value, str) and value.startswith("="):
        return f'<c r="{ref}"{style_attr}><f>{xml_text(value[1:])}</f></c>'

    return (
        f'<c r="{ref}" t="inlineStr"{style_attr}>'
        f'<is><t xml:space="preserve">{xml_text(value)}</t></is>'
        f"</c>"
    )


def make_sheet_xml(
    rows,
    col_widths,
    merges=None,
    freeze_cell: str | None = None,
    filter_range: str | None = None,
) -> str:
    cols_xml = "".join(
        f'<col min="{idx}" max="{idx}" width="{width}" customWidth="1"/>'
        for idx, width in enumerate(col_widths, start=1)
    )

    row_xml_parts = []
    for row_idx, row in enumerate(rows, start=1):
        cells_xml = []
        for col_idx, spec in enumerate(row, start=1):
            if spec is None:
                continue
            if not isinstance(spec, dict):
                spec = cell(spec)
            ref = f"{col_letter(col_idx)}{row_idx}"
            cells_xml.append(make_cell_xml(ref, spec))
        row_xml_parts.append(
            f'<row r="{row_idx}" spans="1:{len(col_widths)}">{"".join(cells_xml)}</row>'
        )
    sheet_data_xml = "".join(row_xml_parts)

    sheet_views_xml = "<sheetViews><sheetView workbookViewId=\"0\"/>"
    if freeze_cell:
        top_left = freeze_cell
        row_num = int("".join(ch for ch in top_left if ch.isdigit()))
        if row_num > 1:
            y_split = row_num - 1
            sheet_views_xml = (
                "<sheetViews><sheetView workbookViewId=\"0\">"
                f'<pane ySplit="{y_split}" topLeftCell="{top_left}" activePane="bottomLeft" state="frozen"/>'
                '<selection pane="bottomLeft" activeCell="A1" sqref="A1"/>'
                "</sheetView></sheetViews>"
            )
    else:
        sheet_views_xml += "</sheetViews>"

    merge_xml = ""
    if merges:
        merge_xml = (
            f'<mergeCells count="{len(merges)}">'
            + "".join(f'<mergeCell ref="{ref}"/>' for ref in merges)
            + "</mergeCells>"
        )

    auto_filter_xml = f'<autoFilter ref="{filter_range}"/>' if filter_range else ""
    dimension = f"A1:{col_letter(len(col_widths))}{len(rows)}"

    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="{dimension}"/>
  {sheet_views_xml}
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>{cols_xml}</cols>
  <sheetData>{sheet_data_xml}</sheetData>
  {auto_filter_xml}
  {merge_xml}
  <pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
</worksheet>
"""


def make_styles_xml() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="5">
    <font>
      <sz val="11"/>
      <color rgb="FF1F2937"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="15"/>
      <color rgb="FFFFFFFF"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FFFFFFFF"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <b/>
      <sz val="11"/>
      <color rgb="FF0F172A"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
    <font>
      <i/>
      <sz val="11"/>
      <color rgb="FF475569"/>
      <name val="Calibri"/>
      <family val="2"/>
    </font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF16386F"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE8F0FE"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border>
      <left/><right/><top/><bottom/><diagonal/>
    </border>
    <border>
      <left style="thin"><color rgb="FFD7DFEA"/></left>
      <right style="thin"><color rgb="FFD7DFEA"/></right>
      <top style="thin"><color rgb="FFD7DFEA"/></top>
      <bottom style="thin"><color rgb="FFD7DFEA"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">
      <alignment vertical="top" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center" wrapText="1"/>
    </xf>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="top" wrapText="1"/>
    </xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>
"""


def make_content_types(sheet_count: int) -> str:
    overrides = [
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    overrides.extend(
        f'<Override PartName="/xl/worksheets/sheet{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for idx in range(1, sheet_count + 1)
    )
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  {overrides}
</Types>
""".format(overrides="".join(overrides))


def make_root_rels() -> str:
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""


def make_workbook_xml(sheet_names) -> str:
    sheets = "".join(
        f'<sheet name="{xml_text(name)}" sheetId="{idx}" r:id="rId{idx}"/>'
        for idx, name in enumerate(sheet_names, start=1)
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView xWindow="120" yWindow="120" windowWidth="28800" windowHeight="16200"/></bookViews>
  <sheets>{sheets}</sheets>
  <calcPr calcId="171027" fullCalcOnLoad="1"/>
</workbook>
"""


def make_workbook_rels(sheet_count: int) -> str:
    rels = [
        f'<Relationship Id="rId{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{idx}.xml"/>'
        for idx in range(1, sheet_count + 1)
    ]
    rels.append(
        f'<Relationship Id="rId{sheet_count + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    )
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {rels}
</Relationships>
""".format(rels="".join(rels))


def make_core_xml() -> str:
    created = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Charlie PC Test Cases Template</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{created}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{created}</dcterms:modified>
</cp:coreProperties>
"""


def make_app_xml(sheet_names) -> str:
    titles = "".join(f"<vt:lpstr>{xml_text(name)}</vt:lpstr>" for name in sheet_names)
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
 xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Excel</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>{len(sheet_names)}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="{len(sheet_names)}" baseType="lpstr">{titles}</vt:vector>
  </TitlesOfParts>
</Properties>
"""


def join_lines(*lines: str) -> str:
    return "\n".join(lines)


WEB_CASES = [
    {
        "id": "WEB-AUTH-001",
        "module": "Authentication",
        "env": "Web - Chrome / Edge / Safari",
        "scenario": "Login as seeded customer account",
        "preconditions": "Backend and frontend are running.\nCustomer account exists.",
        "data": "Email: customer@charliepc.ph\nPassword: cust123\nRole: Customer",
        "steps": join_lines(
            "1. Open the login page.",
            "2. Select Customer.",
            "3. Enter valid email and password.",
            "4. Submit the login form.",
        ),
        "expected": "User is authenticated, customer storefront loads, and the header shows the correct welcome name.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "WEB-AUTH-002",
        "module": "Authentication",
        "env": "Web - Chrome / Edge / Safari",
        "scenario": "Block login when selected role does not match account role",
        "preconditions": "Backend and frontend are running.\nSeeded customer account exists.",
        "data": "Email: customer@charliepc.ph\nPassword: cust123\nSelected Role: Admin",
        "steps": join_lines(
            "1. Open the login page.",
            "2. Select Admin.",
            "3. Enter customer credentials.",
            "4. Submit the form.",
        ),
        "expected": "Login is rejected with a role mismatch message and no authenticated session is created.",
        "priority": "High",
        "type": "Negative",
    },
    {
        "id": "WEB-AUTH-003",
        "module": "Authentication",
        "env": "Web - Chrome / Edge / Safari",
        "scenario": "Validate invalid email format on login",
        "preconditions": "Login page is accessible.",
        "data": "Email: invalid-email\nPassword: anyvalue",
        "steps": join_lines(
            "1. Open the login page.",
            "2. Enter an invalid email address format.",
            "3. Enter any password.",
            "4. Submit the form.",
        ),
        "expected": "The login form shows an email validation message and does not send the user into the app.",
        "priority": "Medium",
        "type": "Validation",
    },
    {
        "id": "WEB-CUST-001",
        "module": "Customer Storefront",
        "env": "Web - Chrome Desktop",
        "scenario": "Load product catalog with seeded items and formatted prices",
        "preconditions": "Seed data is available.\nCustomer storefront is open.",
        "data": "Seeded product catalog",
        "steps": join_lines(
            "1. Open the customer storefront.",
            "2. Wait for products to load.",
            "3. Review at least three visible product cards.",
        ),
        "expected": "Product name, category, image, stock, and price are displayed correctly. Prices use thousand separators where applicable.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "WEB-CUST-002",
        "module": "Customer Storefront",
        "env": "Web - Chrome Desktop",
        "scenario": "Search products by name or category",
        "preconditions": "Product catalog is loaded.",
        "data": "Search term: SSD",
        "steps": join_lines(
            "1. Type SSD in the storefront search bar.",
            "2. Observe the filtered product list.",
            "3. Clear the search field.",
        ),
        "expected": "Only matching products are shown while searching, and the full list returns when the query is cleared.",
        "priority": "Medium",
        "type": "Functional",
    },
    {
        "id": "WEB-CUST-003",
        "module": "Cart Visibility",
        "env": "Web - Chrome Desktop",
        "scenario": "Hide cart entry until an item is added",
        "preconditions": "User is logged in as customer.\nCart is empty.",
        "data": "Customer account",
        "steps": join_lines(
            "1. Open the customer storefront with an empty cart.",
            "2. Observe the header actions.",
            "3. Add one product to the cart.",
            "4. Observe the header again.",
        ),
        "expected": "Cart button is hidden while the cart is empty and becomes visible only after at least one item is added.",
        "priority": "Medium",
        "type": "UI / Functional",
    },
    {
        "id": "WEB-CUST-004",
        "module": "Cart Authorization",
        "env": "Web - Chrome Desktop",
        "scenario": "Prevent guest user from adding to cart",
        "preconditions": "No authenticated customer session exists.",
        "data": "Guest user session",
        "steps": join_lines(
            "1. Open the customer storefront while logged out.",
            "2. Click Add to Cart on an in-stock product.",
        ),
        "expected": "The app prompts the user to log in as customer and does not keep the item in the cart.",
        "priority": "High",
        "type": "Security / Functional",
    },
    {
        "id": "WEB-CUST-005",
        "module": "Cart Management",
        "env": "Web - Chrome Desktop",
        "scenario": "Add an in-stock item and update quantity within stock limit",
        "preconditions": "User is logged in as customer.\nAt least one product has stock greater than 1.",
        "data": "Any in-stock product",
        "steps": join_lines(
            "1. Add an in-stock product to the cart.",
            "2. Open the cart.",
            "3. Increase quantity.",
            "4. Try to exceed available stock.",
        ),
        "expected": "Quantity updates successfully up to the available stock limit and cannot exceed stock.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "WEB-CHK-001",
        "module": "Checkout - Delivery Address",
        "env": "Web - Chrome Desktop",
        "scenario": "Complete PH delivery hierarchy and auto-populate postal code",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Region, Province, Municipality/City, Barangay selections",
        "steps": join_lines(
            "1. Open Cart and proceed to checkout.",
            "2. Select Delivery.",
            "3. Choose a Region, Province, Municipality/City, and Barangay in order.",
            "4. Observe the Postal Code field.",
        ),
        "expected": "Province depends on region, municipality depends on province, barangay depends on municipality, and postal code is auto-filled from the selected municipality.",
        "priority": "High",
        "type": "Validation / Functional",
    },
    {
        "id": "WEB-CHK-002",
        "module": "Checkout - Validation",
        "env": "Web - Chrome Desktop",
        "scenario": "Block checkout on invalid PH mobile number or invalid email",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Phone: 09123\nEmail: bad-email-format",
        "steps": join_lines(
            "1. Open checkout.",
            "2. Enter invalid phone and invalid email.",
            "3. Attempt to place the order.",
        ),
        "expected": "Checkout is blocked and the user is told to correct the mobile number and email address.",
        "priority": "High",
        "type": "Negative / Validation",
    },
    {
        "id": "WEB-CHK-003",
        "module": "Checkout - GCash",
        "env": "Web - Chrome Desktop",
        "scenario": "Require GCash reference number",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Payment Method: GCash\nReference: blank",
        "steps": join_lines(
            "1. Open checkout.",
            "2. Select GCash.",
            "3. Leave the reference number blank.",
            "4. Attempt to place the order.",
        ),
        "expected": "Checkout is blocked until a GCash reference number is provided.",
        "priority": "High",
        "type": "Validation",
    },
    {
        "id": "WEB-CHK-004",
        "module": "Checkout - COD",
        "env": "Web - Chrome Desktop",
        "scenario": "Allow Cash on Delivery only when fulfillment is Delivery",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Fulfillment: Store Pickup\nPayment: Cash on Delivery",
        "steps": join_lines(
            "1. Open checkout.",
            "2. Select Store Pickup.",
            "3. Try to select Cash on Delivery.",
        ),
        "expected": "Cash on Delivery is hidden or blocked when Store Pickup is selected.",
        "priority": "High",
        "type": "Business Rule",
    },
    {
        "id": "WEB-CHK-005",
        "module": "Checkout - Receipt",
        "env": "Web - Chrome Desktop",
        "scenario": "Complete customer checkout and receive receipt",
        "preconditions": "Customer is logged in.\nCart contains at least one in-stock item.",
        "data": "Valid delivery or pickup order details",
        "steps": join_lines(
            "1. Complete all required checkout fields with valid data.",
            "2. Submit the order.",
            "3. Review the receipt details.",
            "4. Refresh product stock data.",
        ),
        "expected": "Order succeeds, receipt number is returned, receipt shows line items and payment details, and product stock is reduced accordingly.",
        "priority": "Critical",
        "type": "End-to-End",
    },
    {
        "id": "WEB-CASH-001",
        "module": "Cashier POS",
        "env": "Web - Chrome Desktop",
        "scenario": "Cashier login opens counter-style POS workspace",
        "preconditions": "Cashier account exists.",
        "data": "Email: cashier@charliepc.ph\nPassword: cashier123\nRole: Cashier",
        "steps": join_lines(
            "1. Open the login page.",
            "2. Select Cashier.",
            "3. Log in with valid cashier credentials.",
        ),
        "expected": "Cashier is routed to the POS interface with product catalog, sale basket, payment panel, and logout action.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "WEB-CASH-002",
        "module": "Cashier POS",
        "env": "Web - Chrome Desktop",
        "scenario": "Process cash sale with sufficient tender",
        "preconditions": "Cashier is logged in.\nAt least one in-stock product exists.",
        "data": "Payment Method: Cash\nTender: greater than or equal to total",
        "steps": join_lines(
            "1. Add products to the current sale.",
            "2. Select Cash payment.",
            "3. Enter or tap a tender amount that covers the total.",
            "4. Process payment.",
        ),
        "expected": "Sale is completed, change is computed correctly, receipt is generated, and stock is reduced.",
        "priority": "Critical",
        "type": "End-to-End",
    },
    {
        "id": "WEB-CASH-003",
        "module": "Cashier POS",
        "env": "Web - Chrome Desktop",
        "scenario": "Block cash sale when tender is insufficient",
        "preconditions": "Cashier is logged in.\nSale has at least one item.",
        "data": "Payment Method: Cash\nTender: lower than total",
        "steps": join_lines(
            "1. Add products to the sale.",
            "2. Enter a cash amount lower than the total.",
            "3. Attempt to process payment.",
        ),
        "expected": "The sale is blocked and the cashier sees an insufficient cash message.",
        "priority": "High",
        "type": "Negative / Validation",
    },
    {
        "id": "WEB-ADMIN-001",
        "module": "Admin - Products",
        "env": "Web - Chrome Desktop",
        "scenario": "Admin can add a new product with image and stock",
        "preconditions": "Admin is logged in.",
        "data": "Email: admin@charliepc.ph\nPassword: admin123\nValid product details",
        "steps": join_lines(
            "1. Log in as admin.",
            "2. Open Products.",
            "3. Fill in product name, category, price, stock, and image.",
            "4. Save the product.",
        ),
        "expected": "Product is created successfully and becomes visible in the product list and customer storefront.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "WEB-ADMIN-002",
        "module": "Admin - Product Security",
        "env": "Web - Chrome Desktop",
        "scenario": "Customer account cannot add product",
        "preconditions": "Customer account is logged in.",
        "data": "Email: gabriel@charliepc.ph\nPassword: gabriel123",
        "steps": join_lines(
            "1. Log in as customer.",
            "2. Attempt to access add-product behavior or send the add-product request from the UI flow.",
        ),
        "expected": "Add Product is unavailable or rejected because product creation requires admin or cashier authorization.",
        "priority": "High",
        "type": "Security",
    },
    {
        "id": "WEB-ADMIN-003",
        "module": "Admin - Products",
        "env": "Web - Chrome Desktop",
        "scenario": "Admin can update or delete an existing product",
        "preconditions": "Admin is logged in.\nAt least one product exists.",
        "data": "Any existing product record",
        "steps": join_lines(
            "1. Open Products as admin.",
            "2. Edit a product and save changes.",
            "3. Delete a product if required.",
        ),
        "expected": "Update succeeds for valid changes and delete succeeds for admin. Product list refreshes correctly after each action.",
        "priority": "Medium",
        "type": "Functional",
    },
    {
        "id": "WEB-SALES-001",
        "module": "Admin - Sales",
        "env": "Web - Chrome Desktop",
        "scenario": "Sales history shows completed sale details",
        "preconditions": "Admin is logged in.\nAt least one completed sale exists.",
        "data": "Any completed sale",
        "steps": join_lines(
            "1. Open Sales History.",
            "2. Select or inspect a completed sale.",
            "3. Review receipt number, totals, items, payment method, and customer details.",
        ),
        "expected": "Completed sale data is visible and matches the stored receipt information.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "WEB-SALES-002",
        "module": "Admin - Sales",
        "env": "Web - Chrome Desktop",
        "scenario": "Voiding a sale marks it voided and restores stock",
        "preconditions": "Admin is logged in.\nAt least one completed sale exists.",
        "data": "Any completed sale with known product quantities",
        "steps": join_lines(
            "1. Open a completed sale.",
            "2. Void the sale.",
            "3. Check sale status and affected product stock.",
        ),
        "expected": "Sale status changes to voided and the product stock used by the sale is restored.",
        "priority": "Critical",
        "type": "End-to-End",
    },
]


MOBILE_CASES = [
    {
        "id": "MOB-AUTH-001",
        "module": "Authentication",
        "env": "Mobile - Android / iOS",
        "scenario": "Login as seeded customer account",
        "preconditions": "Backend and mobile app are running.",
        "data": "Email: customer@charliepc.ph\nPassword: cust123\nRole: Customer",
        "steps": join_lines(
            "1. Open the mobile app.",
            "2. Log in as Customer.",
            "3. Enter valid seeded credentials.",
            "4. Submit the form.",
        ),
        "expected": "Customer is authenticated, shop tabs load, and the header shows Welcome with the active user name.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "MOB-AUTH-002",
        "module": "Authentication",
        "env": "Mobile - Android",
        "scenario": "Keep active text field visible while typing on Android",
        "preconditions": "Android device or emulator is available.",
        "data": "Any valid email and password",
        "steps": join_lines(
            "1. Open the login or register screen on Android.",
            "2. Tap the email field.",
            "3. Open the keyboard and type into email and password fields.",
        ),
        "expected": "The focused field remains visible above the keyboard, similar to the iOS behavior.",
        "priority": "High",
        "type": "Usability / Regression",
    },
    {
        "id": "MOB-AUTH-003",
        "module": "Authentication",
        "env": "Mobile - Android / iOS",
        "scenario": "Block login when selected role does not match account role",
        "preconditions": "Seeded customer account exists.",
        "data": "Email: customer@charliepc.ph\nPassword: cust123\nSelected Role: Admin",
        "steps": join_lines(
            "1. Select Admin on the login screen.",
            "2. Enter customer credentials.",
            "3. Submit the form.",
        ),
        "expected": "Login is blocked and the app shows the role mismatch error.",
        "priority": "High",
        "type": "Negative",
    },
    {
        "id": "MOB-AUTH-004",
        "module": "Authentication",
        "env": "Mobile - Android / iOS",
        "scenario": "Persist authenticated session after app relaunch",
        "preconditions": "User has already logged in successfully.",
        "data": "Any valid role account",
        "steps": join_lines(
            "1. Log in successfully.",
            "2. Close the app.",
            "3. Reopen the app.",
        ),
        "expected": "The app restores the saved token and user from AsyncStorage and routes the user to the correct role-based tabs.",
        "priority": "Medium",
        "type": "Persistence",
    },
    {
        "id": "MOB-SHOP-001",
        "module": "Customer Shop",
        "env": "Mobile - Android / iOS",
        "scenario": "Load products and search by keyword",
        "preconditions": "Customer is logged in.",
        "data": "Search term: Graphics",
        "steps": join_lines(
            "1. Open the Shop tab.",
            "2. Wait for the catalog to load.",
            "3. Search for Graphics.",
            "4. Clear the query.",
        ),
        "expected": "Product list loads correctly, matching products are filtered during search, and the full list returns after clearing the query.",
        "priority": "Medium",
        "type": "Functional",
    },
    {
        "id": "MOB-SHOP-002",
        "module": "Customer Shop",
        "env": "Mobile - Android / iOS",
        "scenario": "Block adding out-of-stock item",
        "preconditions": "Customer is logged in.\nAt least one product has zero stock.",
        "data": "Any out-of-stock product",
        "steps": join_lines(
            "1. Open the Shop tab.",
            "2. Tap Add to Cart on an out-of-stock item.",
        ),
        "expected": "The app does not add the item and shows an out-of-stock message.",
        "priority": "Medium",
        "type": "Negative / Validation",
    },
    {
        "id": "MOB-SHOP-003",
        "module": "Cart Badge",
        "env": "Mobile - Android / iOS",
        "scenario": "Update cart badge after product add",
        "preconditions": "Customer is logged in.\nAt least one in-stock product exists.",
        "data": "Any in-stock product",
        "steps": join_lines(
            "1. Add a product to cart.",
            "2. Review the Cart tab badge.",
        ),
        "expected": "Cart badge increases to reflect the number of items added.",
        "priority": "Medium",
        "type": "UI / Functional",
    },
    {
        "id": "MOB-RESP-001",
        "module": "Responsive Layout",
        "env": "Mobile - Narrow Phone",
        "scenario": "Verify product and checkout layout on a narrow phone screen",
        "preconditions": "App runs on a narrow-width device or emulator profile.",
        "data": "Small phone profile",
        "steps": join_lines(
            "1. Open the Shop and Cart screens.",
            "2. Review card sizing, buttons, and form layout.",
        ),
        "expected": "Layout stays readable with single-column content and touch-friendly controls on narrow screens.",
        "priority": "Medium",
        "type": "Responsive",
    },
    {
        "id": "MOB-RESP-002",
        "module": "Responsive Layout",
        "env": "Mobile - Tablet / Foldable",
        "scenario": "Verify product and admin layouts on a wide or foldable screen",
        "preconditions": "App runs on a tablet or foldable-width emulator/device.",
        "data": "Tablet or foldable profile",
        "steps": join_lines(
            "1. Open Shop, Admin Products, and Admin Sales screens.",
            "2. Observe grids, cards, and header behavior on the wider layout.",
        ),
        "expected": "The app adapts to multi-column and wider layouts without clipped content or broken spacing.",
        "priority": "High",
        "type": "Responsive",
    },
    {
        "id": "MOB-CART-001",
        "module": "Checkout Authorization",
        "env": "Mobile - Android / iOS",
        "scenario": "Require customer login for online checkout",
        "preconditions": "No customer session exists.",
        "data": "Guest or wrong-role session",
        "steps": join_lines(
            "1. Try to use customer checkout without a customer login.",
            "2. Attempt to submit the sale.",
        ),
        "expected": "Checkout is rejected unless the authenticated role is customer.",
        "priority": "High",
        "type": "Security / Functional",
    },
    {
        "id": "MOB-CART-002",
        "module": "Checkout Validation",
        "env": "Mobile - Android / iOS",
        "scenario": "Validate PH phone number and email format",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Phone: 0900\nEmail: invalid-mail",
        "steps": join_lines(
            "1. Open the Cart screen.",
            "2. Enter invalid phone and email values.",
            "3. Attempt checkout.",
        ),
        "expected": "Checkout is blocked until phone and email values are corrected.",
        "priority": "High",
        "type": "Validation",
    },
    {
        "id": "MOB-CART-003",
        "module": "Checkout - Address",
        "env": "Mobile - Android / iOS",
        "scenario": "Complete Region to Barangay flow and show postal code",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Delivery order details",
        "steps": join_lines(
            "1. Open the Cart screen.",
            "2. Select Delivery.",
            "3. Pick Region, Province, Municipality/City, and Barangay in sequence.",
            "4. Check the Postal Code field.",
        ),
        "expected": "Selections are dependent in order and postal code is populated automatically once municipality is selected.",
        "priority": "High",
        "type": "Validation / Functional",
    },
    {
        "id": "MOB-CART-004",
        "module": "Checkout - Card",
        "env": "Mobile - Android / iOS",
        "scenario": "Require complete card fields before checkout",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Payment Method: Card\nIncomplete card fields",
        "steps": join_lines(
            "1. Open checkout.",
            "2. Select Card.",
            "3. Leave cardholder, card number, expiry, or CVV incomplete.",
            "4. Attempt to place the order.",
        ),
        "expected": "Checkout is blocked until cardholder name, 16-digit card number, MM/YY expiry, and CVV are valid.",
        "priority": "High",
        "type": "Validation",
    },
    {
        "id": "MOB-CART-005",
        "module": "Checkout - GCash",
        "env": "Mobile - Android / iOS",
        "scenario": "Require valid GCash number and reference",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Payment Method: GCash\nReference: blank",
        "steps": join_lines(
            "1. Open checkout.",
            "2. Select GCash.",
            "3. Enter invalid or blank GCash details.",
            "4. Attempt checkout.",
        ),
        "expected": "Checkout is blocked until a valid PH GCash number and reference number are entered.",
        "priority": "High",
        "type": "Validation",
    },
    {
        "id": "MOB-CART-006",
        "module": "Checkout - COD",
        "env": "Mobile - Android / iOS",
        "scenario": "Restrict Cash on Delivery to delivery orders",
        "preconditions": "Customer is logged in.\nCart contains at least one item.",
        "data": "Fulfillment: Pickup\nPayment: Cash on Delivery",
        "steps": join_lines(
            "1. Open checkout.",
            "2. Select Pickup.",
            "3. Try to keep or choose Cash on Delivery.",
        ),
        "expected": "Cash on Delivery is unavailable or blocked for pickup orders.",
        "priority": "High",
        "type": "Business Rule",
    },
    {
        "id": "MOB-CART-007",
        "module": "Checkout - Receipt",
        "env": "Mobile - Android / iOS",
        "scenario": "Complete checkout and show receipt dialog",
        "preconditions": "Customer is logged in.\nCart contains at least one in-stock item.",
        "data": "Any valid customer order data",
        "steps": join_lines(
            "1. Fill in valid checkout details.",
            "2. Submit the order.",
            "3. Review the receipt dialog.",
            "4. Reopen the Shop tab and refresh products.",
        ),
        "expected": "Sale succeeds, receipt data is shown, cart is cleared, and stock is reduced.",
        "priority": "Critical",
        "type": "End-to-End",
    },
    {
        "id": "MOB-ADMIN-001",
        "module": "Admin Navigation",
        "env": "Mobile - Android / iOS",
        "scenario": "Admin account loads Dashboard, Products, Sales, and Profile tabs",
        "preconditions": "Admin account exists.",
        "data": "Email: admin@charliepc.ph\nPassword: admin123\nRole: Admin",
        "steps": join_lines(
            "1. Log in as admin.",
            "2. Review the visible tabs.",
            "3. Open each tab once.",
        ),
        "expected": "Dashboard, Products, Sales, and Profile tabs are available and load successfully.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "MOB-ADMIN-002",
        "module": "Admin Products",
        "env": "Mobile - Android / iOS",
        "scenario": "Admin can add, edit, and delete product",
        "preconditions": "Admin is logged in.",
        "data": "Any valid test product",
        "steps": join_lines(
            "1. Open the Products tab as admin.",
            "2. Add a product.",
            "3. Edit the same product.",
            "4. Delete the product.",
        ),
        "expected": "All admin product actions succeed and the list refreshes after each action.",
        "priority": "High",
        "type": "Functional",
    },
    {
        "id": "MOB-CASH-001",
        "module": "Cashier Payment",
        "env": "Mobile - Android / iOS",
        "scenario": "Cashier processes cash payment using quick tender options",
        "preconditions": "Cashier is logged in.\nAt least one in-stock product exists.",
        "data": "Email: cashier@charliepc.ph\nPassword: cashier123\nCash tender using quick buttons",
        "steps": join_lines(
            "1. Log in as cashier.",
            "2. Add products to the counter cart.",
            "3. Open the Payment tab.",
            "4. Use a quick tender amount greater than or equal to the total.",
            "5. Process the payment.",
        ),
        "expected": "Payment succeeds, receipt is generated, and stock is updated.",
        "priority": "Critical",
        "type": "End-to-End",
    },
    {
        "id": "MOB-CASH-002",
        "module": "Cashier Product Rights",
        "env": "Mobile - Android / iOS",
        "scenario": "Cashier can add product but cannot use admin-only edit/delete permissions",
        "preconditions": "Cashier is logged in.",
        "data": "Email: claire@charliepc.ph\nPassword: claire123",
        "steps": join_lines(
            "1. Log in as cashier.",
            "2. Open Manage Products.",
            "3. Try adding a product.",
            "4. Try editing or deleting an existing product.",
        ),
        "expected": "Cashier can add a product if allowed by the app flow, but edit/delete actions that require admin should be blocked or unavailable.",
        "priority": "High",
        "type": "Security / Functional",
    },
    {
        "id": "MOB-PROFILE-001",
        "module": "User Identity",
        "env": "Mobile - Android / iOS",
        "scenario": "Show current user in the header",
        "preconditions": "Any role has logged in successfully.",
        "data": "Any valid account",
        "steps": join_lines(
            "1. Log in with a valid account.",
            "2. Observe the tab header area.",
        ),
        "expected": "The app shows Welcome, {User} so the active signed-in user is clear.",
        "priority": "Low",
        "type": "UI",
    },
]


def build_instructions_rows():
    today = datetime.now().strftime("%B %d, %Y")
    return [
        [cell("Charlie PC Test Cases Template", 1), None, None, None, None, None],
        [cell(f"Prepared for Charlie PC web and mobile testing - Generated {today}", 5), None, None, None, None, None],
        [cell("How to Use This Workbook", 4), None, None, None, None, None],
        [cell("1. Use the Web Test Cases sheet for browser-based execution and the Mobile Test Cases sheet for Android/iOS execution.", 3), None, None, None, None, None],
        [cell("2. Keep the prefilled scenario, preconditions, and expected result text as the baseline. Update the Environment, Tester, Status, Actual Result, Test Date, and Remarks columns during execution.", 3), None, None, None, None, None],
        [cell("3. Suggested status values: Not Run, Passed, Failed, Blocked, Retest.", 3), None, None, None, None, None],
        [cell("4. Suggested priority values: Critical, High, Medium, Low.", 3), None, None, None, None, None],
        [cell("5. Use the Summary sheet to record the test cycle, build number, devices, browsers, and execution totals.", 3), None, None, None, None, None],
        [cell("Status Definitions", 4), None, None, None, None, None],
        [cell("Status", 2), cell("Meaning", 2), None, None, None, None],
        [cell("Not Run", 3), cell("Test case has not been executed yet.", 3), None, None, None, None],
        [cell("Passed", 3), cell("Actual result matches the expected result.", 3), None, None, None, None],
        [cell("Failed", 3), cell("Actual result does not match the expected result.", 3), None, None, None, None],
        [cell("Blocked", 3), cell("Execution cannot continue because of an environment issue, missing dependency, or unresolved defect.", 3), None, None, None, None],
        [cell("Retest", 3), cell("The case is being executed again after a fix or environment change.", 3), None, None, None, None],
        [cell("Recommended Web Environments", 4), None, None, None, None, None],
        [cell("Browsers", 3), cell("Chrome latest, Edge latest, Safari latest", 3), None, None, None, None],
        [cell("Desktop Sizes", 3), cell("1366x768, 1440x900, 1920x1080", 3), None, None, None, None],
        [cell("Recommended Mobile Environments", 4), None, None, None, None, None],
        [cell("Platforms", 3), cell("Android phone, iPhone, tablet / foldable-width profile", 3), None, None, None, None],
        [cell("Areas to Observe", 3), cell("Responsive layout, keyboard handling, role-based tabs, receipts, checkout validation", 3), None, None, None, None],
    ]


def build_summary_rows(web_count: int, mobile_count: int):
    return [
        [cell("Charlie PC Test Execution Summary", 1), None, None, None, None, None, None, None],
        [cell("Use this sheet to record the active test cycle, environments, and execution totals for both platforms.", 5), None, None, None, None, None, None, None],
        [cell("Project Information", 4), None, None, None, None, None, None, None],
        [cell("Project Name", 3), cell("Charlie PC", 3), cell("Test Cycle", 3), cell("", 3), cell("Build / Version", 3), cell("", 3), cell("Prepared By", 3), cell("", 3)],
        [cell("Backend Base URL", 3), cell("http://localhost:5000 or configured environment port", 3), cell("Web URL", 3), cell("http://localhost:5173 / configured Vite port", 3), cell("Mobile API URL", 3), cell("EXPO_PUBLIC_API_URL value", 3), cell("Date Executed", 3), cell("", 3)],
        [cell("Seeded Test Accounts", 3), cell("admin@charliepc.ph, cashier@charliepc.ph, claire@charliepc.ph, customer@charliepc.ph, gabriel@charliepc.ph, carl@charliepc.ph", 3), cell("Browsers", 3), cell("Chrome / Edge / Safari", 3), cell("Devices", 3), cell("Android / iPhone / tablet / foldable", 3), cell("Tester Notes", 3), cell("", 3)],
        [cell("Execution Dashboard", 4), None, None, None, None, None, None, None],
        [cell("Metric", 2), cell("Web", 2), cell("Mobile", 2), cell("Notes", 2), None, None, None, None],
        [cell("Total Test Cases", 3), cell("=COUNTA('Web Test Cases'!A3:A500)", 3), cell("=COUNTA('Mobile Test Cases'!A3:A500)", 3), cell("Automatically counts populated test IDs.", 3), None, None, None, None],
        [cell("Passed", 3), cell("=COUNTIF('Web Test Cases'!K3:K500,\"Passed\")", 3), cell("=COUNTIF('Mobile Test Cases'!K3:K500,\"Passed\")", 3), cell("Update Status column during execution.", 3), None, None, None, None],
        [cell("Failed", 3), cell("=COUNTIF('Web Test Cases'!K3:K500,\"Failed\")", 3), cell("=COUNTIF('Mobile Test Cases'!K3:K500,\"Failed\")", 3), cell("Review Actual Result and Remarks for defects.", 3), None, None, None, None],
        [cell("Blocked", 3), cell("=COUNTIF('Web Test Cases'!K3:K500,\"Blocked\")", 3), cell("=COUNTIF('Mobile Test Cases'!K3:K500,\"Blocked\")", 3), cell("Use for environment or dependency blockers.", 3), None, None, None, None],
        [cell("Not Run", 3), cell("=COUNTIF('Web Test Cases'!K3:K500,\"Not Run\")", 3), cell("=COUNTIF('Mobile Test Cases'!K3:K500,\"Not Run\")", 3), cell("Optional if you explicitly enter Not Run.", 3), None, None, None, None],
        [cell("Retest", 3), cell("=COUNTIF('Web Test Cases'!K3:K500,\"Retest\")", 3), cell("=COUNTIF('Mobile Test Cases'!K3:K500,\"Retest\")", 3), cell("Use after fixes are deployed.", 3), None, None, None, None],
        [cell("Coverage Notes", 4), None, None, None, None, None, None, None],
        [cell("Web focus", 3), cell("Customer storefront, cart/checkout, cashier POS, admin dashboard/products/sales", 3), cell("Mobile focus", 3), cell("Auth, responsive layout, shop/cart, admin tabs, cashier payment flow", 3), None, None, None, None],
        [cell("Planned Web Cases", 3), cell(web_count, 3), cell("Planned Mobile Cases", 3), cell(mobile_count, 3), None, None, None, None],
    ]


def build_test_case_rows(title: str, cases, platform_label: str):
    header = [
        cell(title, 1), None, None, None, None, None, None, None, None, None, None, None, None, None, None
    ]
    headers = [
        cell("Test Case ID", 2),
        cell("Module", 2),
        cell("Environment", 2),
        cell("Scenario / Objective", 2),
        cell("Preconditions", 2),
        cell("Test Data", 2),
        cell("Test Steps", 2),
        cell("Expected Result", 2),
        cell("Priority", 2),
        cell("Test Type", 2),
        cell("Status", 2),
        cell("Actual Result", 2),
        cell("Tester", 2),
        cell("Test Date", 2),
        cell("Remarks", 2),
    ]
    rows = [header, headers]
    for case in cases:
        rows.append(
            [
                cell(case["id"], 3),
                cell(case["module"], 3),
                cell(case["env"], 3),
                cell(case["scenario"], 3),
                cell(case["preconditions"], 3),
                cell(case["data"], 3),
                cell(case["steps"], 3),
                cell(case["expected"], 3),
                cell(case["priority"], 3),
                cell(case["type"], 3),
                cell("", 3),
                cell("", 3),
                cell("", 3),
                cell("", 3),
                cell(f"{platform_label} execution notes", 5),
            ]
        )
    return rows


def build_workbook():
    sheet_names = ["Instructions", "Summary", "Web Test Cases", "Mobile Test Cases"]

    instructions = {
        "name": sheet_names[0],
        "rows": build_instructions_rows(),
        "widths": [22, 72, 16, 16, 16, 16],
        "merges": [
            "A1:F1",
            "A2:F2",
            "A3:F3",
            "A9:F9",
            "A16:F16",
            "A19:F19",
        ],
        "freeze": None,
        "filter": None,
    }

    summary = {
        "name": sheet_names[1],
        "rows": build_summary_rows(len(WEB_CASES), len(MOBILE_CASES)),
        "widths": [22, 42, 20, 32, 18, 28, 18, 20],
        "merges": ["A1:H1", "A2:H2", "A3:H3", "A7:H7", "A15:H15"],
        "freeze": None,
        "filter": None,
    }

    web_rows = build_test_case_rows("Charlie PC Web Test Cases", WEB_CASES, "Web")
    web = {
        "name": sheet_names[2],
        "rows": web_rows,
        "widths": [16, 18, 22, 28, 26, 24, 36, 36, 12, 14, 12, 24, 16, 14, 20],
        "merges": ["A1:O1"],
        "freeze": "A3",
        "filter": "A2:O2",
    }

    mobile_rows = build_test_case_rows("Charlie PC Mobile Test Cases", MOBILE_CASES, "Mobile")
    mobile = {
        "name": sheet_names[3],
        "rows": mobile_rows,
        "widths": [16, 18, 22, 28, 26, 24, 36, 36, 12, 14, 12, 24, 16, 14, 20],
        "merges": ["A1:O1"],
        "freeze": "A3",
        "filter": "A2:O2",
    }

    sheets = [instructions, summary, web, mobile]

    with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", make_content_types(len(sheets)))
        zf.writestr("_rels/.rels", make_root_rels())
        zf.writestr("docProps/core.xml", make_core_xml())
        zf.writestr("docProps/app.xml", make_app_xml(sheet_names))
        zf.writestr("xl/workbook.xml", make_workbook_xml(sheet_names))
        zf.writestr("xl/_rels/workbook.xml.rels", make_workbook_rels(len(sheets)))
        zf.writestr("xl/styles.xml", make_styles_xml())

        for idx, sheet in enumerate(sheets, start=1):
            zf.writestr(
                f"xl/worksheets/sheet{idx}.xml",
                make_sheet_xml(
                    rows=sheet["rows"],
                    col_widths=sheet["widths"],
                    merges=sheet["merges"],
                    freeze_cell=sheet["freeze"],
                    filter_range=sheet["filter"],
                ),
            )


if __name__ == "__main__":
    build_workbook()
    print(f"Created {OUTPUT}")
